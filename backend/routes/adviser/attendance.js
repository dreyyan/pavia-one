// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName } = require('../../utils/helpers');
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

module.exports = router;