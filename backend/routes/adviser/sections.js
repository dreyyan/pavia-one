// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName } = require('../../utils/helpers');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] List students assigned to this adviser's sections
// /api/adviser/sections/students
router.get('/students', verifyAdviser, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'lrn', sortOrder = 'asc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // [1] Get all section IDs managed by this adviser
    const sections = await prisma.section.findMany({
      where: { adviserId: req.adviserId },
      select: { id: true }
    });
    const sectionIds = sections.map(s => s.id);

    // [2] If adviser manages no sections, return empty
    if (sectionIds.length === 0) {
      return res.json(successResponse('No sections assigned', { data: [], pagination: {} }));
    }

    // [3] Build filter: only students in adviser's sections + optional search
    const enrollmentWhere = {
      sectionId: { in: sectionIds }, // enforce adviser access
      student: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { nameExtension: { contains: search, mode: 'insensitive' } },
              { lrn: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        : undefined
    };

    // [4] Fetch enrollments with included student info
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: {
          student: true,
          section: { select: { id: true, name: true, gradeLevel: true } }
        },
        orderBy: { student: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } },
        skip,
        take
      }),
      prisma.enrollment.count({ where: enrollmentWhere })
    ]);

    // [5] Map enrollments to student objects
    const students = enrollments.map(e => ({
      ...e.student,
      fullName: getFullName(e.student),
      section: e.section
    }));

    // [6] Prepare pagination
    const totalPages = Math.ceil(total / take);

    // *[SUCCESS] Return students with pagination
    res.json(
      successResponse('Students retrieved successfully', {
        data: students,
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      })
    );
  } catch (err) {
    console.error('Adviser students fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch students', err.message));
  }
});

// ?[GET] Get a specific section and its students
// /api/adviser/sections/:sectionId
router.get('/:sectionId', verifyAdviser, async (req, res) => {
  const { sectionId } = req.params;
  try {
    // [1] Fetch the section only if managed by this adviser
    const section = await prisma.section.findFirst({
      where: {
        id: parseInt(sectionId),
        adviserId: req.adviserId // enforce adviser access
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        createdAt: true,
        enrollments: {
          select: {
            student: {
              select: {
                id: true,
                lrn: true,
                firstName: true,
                middleName: true,
                lastName: true,
                nameExtension: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    // [2] Return 404 if section not found or not managed by this adviser
    if (!section) {
      return res.status(404).json(errorResponse('Section not found or not managed by you'));
    }

    // [3] Map enrollments to student objects
    const students = section.enrollments.map(e => ({
      ...e.student,
      fullName: getFullName(e.student)
    }));

    // *[SUCCESS] Return section with students
    res.json(successResponse('Section retrieved successfully', {
      id: section.id,
      name: section.name,
      gradeLevel: section.gradeLevel,
      createdAt: section.createdAt,
      students
    }));
  } catch (err) {
    console.error('Adviser section fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch section', err.message));
  }
});

// ?[POST] Bulk create students and enroll them to a section
// /api/adviser/sections/:sectionId/enrollments
router.post('/:sectionId/enrollments', verifyAdviser, async (req, res) => {
  try {
    const { students, schoolYear, learningModality = 'FACE_TO_FACE' } = req.body;
    const sectionId = parseInt(req.params.sectionId);

    // Validate input
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json(errorResponse('students array is required'));
    }
    if (!schoolYear) {
      return res.status(400).json(errorResponse('schoolYear is required'));
    }

    // [1] Verify adviser manages this section
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { adviserId: true }
    });
    if (!section || section.adviserId !== req.adviserId) {
      return res.status(403).json(errorResponse('You do not manage this section'));
    }

    // [2] Prepare students: check existing by LRN
    const lrns = students.map(s => s.lrn);
    const existingStudents = await prisma.student.findMany({
      where: { lrn: { in: lrns } },
      select: { id: true, lrn: true }
    });

    const existingLrns = existingStudents.map(s => s.lrn);
    const newStudents = students.filter(s => !existingLrns.includes(s.lrn));

    // [3] Create new students if they don't exist
    const createdStudents = await Promise.all(
      newStudents.map(s =>
        prisma.student.create({
          data: {
            lrn: s.lrn,
            firstName: s.firstName,
            middleName: s.middleName,
            lastName: s.lastName,
            nameExtension: s.nameExtension,
            sex: s.sex,
            email: s.email,
            createdByAdviserId: req.adviserId,
            birthDate: new Date(s.birthDate)
          },
          select: { id: true, lrn: true }
        })
      )
    );

    // Merge existing + newly created students for enrollment
    const allStudents = [...existingStudents, ...createdStudents];

    // [4] Check for existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: allStudents.map(s => s.id) },
        sectionId,
        schoolYear
      },
      select: { studentId: true }
    });

    const alreadyEnrolledIds = existingEnrollments.map(e => e.studentId);
    const toEnroll = allStudents.filter(s => !alreadyEnrolledIds.includes(s.id));

    if (toEnroll.length === 0) {
      return res.status(400).json(errorResponse('All students are already enrolled in this section for this school year'));
    }

    // [5] Bulk create enrollments
    const createdEnrollments = await prisma.enrollment.createMany({
      data: toEnroll.map(s => ({
        studentId: s.id,
        sectionId,
        schoolYear,
        learningModality
      })),
      skipDuplicates: true
    });

    res.json(
      successResponse('Students created and enrolled successfully', {
        totalStudentsProcessed: allStudents.length,
        studentsCreated: createdStudents.length,
        enrollmentsCreated: createdEnrollments.count
      })
    );
  } catch (err) {
    console.error('Adviser bulk student enrollment error:', err);
    res.status(500).json(errorResponse('Failed to create students/enrollments', err.message));
  }
});

module.exports = router;