// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName, validateSF2Completeness } = require('../../utils/helpers');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[POST] Record or update attendance (single or bulk)
// /api/adviser/attendance
router.post('/', verifyAdviser, async (req, res) => {
  try {
    const { attendanceDate, records } = req.body;

    // [0] Validate input
    if (!attendanceDate || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json(
        errorResponse('attendanceDate and records array are required')
      );
    }

    const normalizedDate = new Date(attendanceDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // [1] Get all studentIds from request
    const studentIds = records.map(r => r.studentId);

    // [2] Verify all students belong to adviser
    const validEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        section: { adviserId: req.adviserId }
      },
      select: { studentId: true }
    });

    const validStudentIds = validEnrollments.map(e => e.studentId);

    if (validStudentIds.length !== studentIds.length) {
      return res.status(403).json(
        errorResponse('One or more students are not in your section')
      );
    }

    // [3] Perform bulk upsert using transaction
    const attendanceResults = await prisma.$transaction(
      records.map(record =>
        prisma.sF2StudentAttendance.upsert({
          where: {
            studentId_attendanceDate: {
              studentId: record.studentId,
              attendanceDate: normalizedDate
            }
          },
          update: { status: record.status },
          create: {
            studentId: record.studentId,
            attendanceDate: normalizedDate,
            status: record.status
          }
        })
      )
    );

    // *[SUCCESS] Bulk attendance recorded successfully
    res.json(
      successResponse(
        'Bulk attendance recorded successfully',
        attendanceResults
      )
    );
  } catch (err) {
    console.error('Bulk attendance error:', err);
    res.status(500).json(
      errorResponse('Failed to record attendance', err.message)
    );
  }
});

// ?[GET] Get all students in a section with their attendance
// /api/adviser/attendance/section/:sectionId
router.get('/section/:sectionId', verifyAdviser, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const { from, to } = req.query;

    // [0] Validate section ownership
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        adviserId: req.adviserId
      },
      select: { id: true, name: true }
    });

    if (!section) {
      return res.status(404).json(
        errorResponse('Section not found or not managed by you')
      );
    }

    // [1] Build attendance date filter (optional)
    let attendanceFilter = {};
    if (from && to) {
      attendanceFilter = {
        attendanceDate: {
          gte: new Date(from),
          lte: new Date(to)
        }
      };
    }

    // [2] Get students with attendance
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId },
      include: {
        student: {
          include: {
            dailyAttendances: {
              where: attendanceFilter,
              orderBy: { attendanceDate: 'desc' }
            }
          }
        }
      }
    });

    // [3] Format response
    const students = enrollments.map(e => ({
      id: e.student.id,
      lrn: e.student.lrn,
      fullName: getFullName(e.student),
      attendances: e.student.dailyAttendances
    }));

    // *[SUCCESS] Section attendance retrieved successfully
    res.json(
      successResponse(
        'Section attendance retrieved successfully',
        {
          sectionId: section.id,
          sectionName: section.name,
          students
        }
      )
    );

  } catch (err) {
    console.error('Section attendance fetch error:', err);
    res.status(500).json(
      errorResponse('Failed to fetch section attendance', err.message)
    );
  }
});

// ?[GET] Get attendance of a specific student
// /api/adviser/attendance/:studentId
router.get('/:studentId', verifyAdviser, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // [1] Verify that the student belongs to one of the adviser's sections
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        section: { adviserId: req.adviserId }
      },
      select: { id: true }
    });

    if (!studentEnrollment) {
      return res.status(403).json(errorResponse('You cannot view attendance for a student not in your section'));
    }

    // [2] Fetch attendance records
    const attendanceRecords = await prisma.sF2StudentAttendance.findMany({
      where: { studentId },
      orderBy: { attendanceDate: 'desc' }
    });

    // *[SUCCESS] Return attendance
    res.json(successResponse('Attendance retrieved successfully', attendanceRecords));
  } catch (err) {
    console.error('Attendance fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch attendance', err.message));
  }
});

// ?[DELETE] Remove a wrongly recorded attendance (protected)
// /api/attendance/:attendanceId
router.delete('/:attendanceId', verifyAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // ![ERROR] Validate input
    if (!attendanceId) {
      return res.status(400).json(errorResponse('attendanceId is required'));
    }

    // Check if the attendance exists
    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) {
      return res.status(404).json(errorResponse('Attendance record not found'));
    }

    // Delete the attendance record
    await prisma.attendance.delete({ where: { id: attendanceId } });

    // *[SUCCESS] Return success message
    res.json(successResponse('Attendance record deleted successfully', { attendanceId }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete attendance record', err.message));
  }
});


// ?[GET] Generate weekly attendance report for a section (protected)
// /api/adviser/attendance/weekly-report/:sectionId
router.get('/weekly-report/:sectionId', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { weekStart } = req.query; // optional: YYYY-MM-DD

    // ![ERROR] Validate input
    if (!sectionId) {
      return res.status(400).json(errorResponse('sectionId is required'));
    }

    const startDate = weekStart ? new Date(weekStart) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // week = 7 days

    // Fetch attendance records for the week
    const records = await prisma.attendance.findMany({
      where: {
        sectionId,
        date: { gte: startDate, lte: endDate },
      },
      include: { student: true },
    });

    // Summarize attendance per student
    const summary = {};
    records.forEach(rec => {
      if (!summary[rec.studentId]) {
        summary[rec.studentId] = { studentId: rec.studentId, name: rec.student.name, present: 0, absent: 0, excused: 0 };
      }
      summary[rec.studentId][rec.status] += 1; // assumes status = 'present' | 'absent' | 'excused'
    });

    // *[SUCCESS] Return weekly report
    res.json(successResponse('Weekly attendance report', {
      sectionId,
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      attendanceSummary: Object.values(summary),
    }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to generate weekly attendance report', err.message));
  }
});


// ?[GET] Generate monthly attendance report for a section (protected)
// /api/adviser/attendance/monthly-report/:sectionId
router.get('/monthly-report/:sectionId', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { month, year } = req.query; // optional: month = 1-12, year = YYYY

    // ![ERROR] Validate input
    if (!sectionId) {
      return res.status(400).json(errorResponse('sectionId is required'));
    }

    const now = new Date();
    const reportMonth = month ? parseInt(month) - 1 : now.getMonth(); // JS months 0-11
    const reportYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0); // last day of month

    // Fetch attendance records for the month
    const records = await prisma.attendance.findMany({
      where: {
        sectionId,
        date: { gte: startDate, lte: endDate },
      },
      include: { student: true },
    });

    // Summarize attendance per student
    const summary = {};
    records.forEach(rec => {
      if (!summary[rec.studentId]) {
        summary[rec.studentId] = { studentId: rec.studentId, name: rec.student.name, present: 0, absent: 0, excused: 0 };
      }
      summary[rec.studentId][rec.status] += 1;
    });

    // *[SUCCESS] Return monthly report
    res.json(successResponse('Monthly attendance report', {
      sectionId,
      month: reportMonth + 1,
      year: reportYear,
      attendanceSummary: Object.values(summary),
    }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to generate monthly attendance report', err.message));
  }
});

// ?[GET] Generate full SF2 attendance for a student
// /api/adviser/attendance/sf2/:studentId
router.get('/sf2/:studentId', verifyAdviser, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { schoolYear, from, to } = req.query;

    // [1] Verify student belongs to adviser's sections
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        section: { adviserId: req.adviserId }
      },
      select: { id: true, sectionId: true, schoolYear: true }
    });

    if (!studentEnrollment) {
      return res.status(403).json(
        errorResponse('You cannot access SF2 attendance for a student not in your section')
      );
    }

    // [2] Build optional date filters
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // [3] Fetch student with all SF2 data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        address: true,
        guardian: true,
        enrollments: {
          include: { section: true },
          where: schoolYear ? { schoolYear } : undefined
        },
        dailyAttendances: {
          where: Object.keys(dateFilter).length ? { attendanceDate: dateFilter } : undefined,
          orderBy: { attendanceDate: 'asc' }
        },
        monthlySummaries: {
          where: schoolYear ? { schoolYear } : undefined,
          orderBy: { month: 'asc' }
        },
        sf9Grades: { include: { learningArea: true } },
        sf9CoreValues: { include: { coreValue: true } },
        sf9Summaries: schoolYear ? { where: { schoolYear } } : true,
        sf5Reports: schoolYear ? { where: { schoolYear } } : true
      }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student not found'));
    }

    // [4] Format SF2 response
    const sf2Data = {
      studentInfo: {
        id: student.id,
        lrn: student.lrn,
        fullName: getFullName(student),
        sex: student.sex,
        birthDate: student.birthDate,
        email: student.email,
        address: student.address || null,
        guardian: student.guardian || null,
        accountStatus: student.accountStatus
      },
      enrollments: student.enrollments.map(e => ({
        sectionId: e.sectionId,
        sectionName: e.section.name,
        schoolYear: e.schoolYear,
        learningModality: e.learningModality,
        status: e.status,
        enrollmentDate: e.enrollmentDate,
        remarks: e.remarks
      })),
      dailyAttendances: student.dailyAttendances.map(a => ({
        attendanceDate: a.attendanceDate,
        status: a.status
      })),
      monthlySummaries: student.monthlySummaries.map(m => ({
        month: m.month,
        schoolYear: m.schoolYear,
        totalPresent: m.totalPresent,
        totalAbsent: m.totalAbsent,
        remarks: m.remarks
      })),
      sf9Grades: student.sf9Grades.map(g => ({
        learningArea: g.learningArea.name,
        schoolYear: g.schoolYear,
        q1: g.q1,
        q2: g.q2,
        q3: g.q3,
        q4: g.q4,
        finalRating: g.finalRating,
        remarks: g.remarks
      })),
      sf9CoreValues: student.sf9CoreValues.map(c => ({
        coreValue: c.coreValue.name,
        q1: c.q1,
        q2: c.q2,
        q3: c.q3,
        q4: c.q4
      })),
      sf9Summaries: student.sf9Summaries.map(s => ({
        schoolYear: s.schoolYear,
        generalAverage: s.generalAverage
      })),
      sf5Reports: student.sf5Reports.map(s => ({
        schoolYear: s.schoolYear,
        generalAverage: s.generalAverage,
        actionTaken: s.actionTaken,
        learningAreasNotMet: s.learningAreasNotMet
      }))
    };

    // [5] Check SF2 completeness
    const completeness = validateSF2Completeness(sf2Data);

    // *[SUCCESS] Return SF2 attendance + completeness info
    res.json(successResponse(
      'Full SF2 attendance retrieved successfully',
      { sf2Data, ...completeness }
    ));

  } catch (err) {
    console.error('SF2 attendance fetch error:', err);
    res.status(500).json(
      errorResponse('Failed to fetch full SF2 attendance', err.message)
    );
  }
});

module.exports = router;