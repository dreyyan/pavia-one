// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// Helper: build full name
const getFullName = (student) =>
  [student.firstName, student.middleName, student.lastName, student.nameExtension]
    .filter(Boolean)
    .join(' ');

// ?[GET] List all students (paginated, searchable, admin-only)
// /api/admin/students
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'lrn',   // lrn, firstName, createdAt
      sortOrder = 'asc',
      search = '',      // optional search by name / lrn / email
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { middleName: { contains: search, mode: 'insensitive' } },
            { lrn: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          lrn: true,
          firstName: true,
          middleName: true,
          lastName: true,
          nameExtension: true,
          sex: true,
          birthDate: true,
          email: true,
          createdAt: true,
          adviser: { select: { id: true, name: true, adviserId: true } },
          enrollments: {
            where: { status: 'ENROLLED' }, // only current enrollment
            select: {
              section: {
                select: { id: true, name: true, gradeLevel: true },
              },
            },
            take: 1, // only get the first active enrollment
          },
        },
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take,
      }),
      prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    // Map section from first enrollment and add fullName
    const studentsWithSection = students.map((s) => ({
      ...s,
      fullName: getFullName(s),
      section: s.enrollments[0]?.section || null,
      enrollments: undefined, // remove enrollments array from response
    }));

    res.json(
      successResponse('Students retrieved successfully', {
        data: studentsWithSection,
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      })
    );
  } catch (err) {
    console.error('Admin students fetch error:', err);
    res.status(500).json(errorResponse('[ERROR] Failed to fetch students.', err.message));
  }
});

// ?[POST] Add student
router.post('/', verifyAdmin, async (req, res) => {
  const { lrn, firstName, middleName, lastName, nameExtension, email, password, sex, birthDate, sectionId, createdByAdviserId } = req.body;

  try {
    // Validate required fields
    if (!lrn || !firstName || !lastName || !email || !password || !sex || !createdByAdviserId) {
      return res.status(400).json(
        errorResponse('LRN, firstName, lastName, email, password, sex, and createdByAdviserId are required')
      );
    }

    // Check if student already exists
    const existing = await prisma.student.findFirst({
      where: { OR: [{ email }, { lrn }] }
    });
    if (existing) return res.status(409).json(errorResponse('Student already exists'));

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build student creation data
    const studentData = {
      lrn,
      firstName,
      middleName: middleName || null,
      lastName,
      nameExtension: nameExtension || null,
      email,
      password: hashedPassword,
      sex,
      birthDate: birthDate || null,
      createdByAdviserId,
      // If sectionId is provided, create enrollment immediately
      enrollments: sectionId
        ? {
            create: {
              sectionId,
              status: 'ENROLLED'
            }
          }
        : undefined,
    };

    // Create student
    const newStudent = await prisma.student.create({
      data: studentData,
      select: {
        id: true,
        lrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        nameExtension: true,
        email: true,
        sex: true,
        birthDate: true,
        createdAt: true,
        adviser: { select: { id: true, name: true, adviserId: true } },
        enrollments: {
          where: { status: 'ENROLLED' },
          select: { section: { select: { id: true, name: true } } },
          take: 1,
        },
      },
    });

    // Add section and fullName
    res.status(201).json(successResponse('Student created successfully', {
      ...newStudent,
      fullName: getFullName(newStudent),
      section: newStudent.enrollments[0]?.section || null,
      enrollments: undefined,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse('Failed to create student', err.message));
  }
});

// ?[DELETE] Delete a student (admin-only)
// /api/admin/students/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        lrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        nameExtension: true,
        email: true,
      },
    });

    if (!student) return res.status(404).json(errorResponse('Student not found'));

    await prisma.student.delete({ where: { id: parseInt(id) } });

    res.json(successResponse('Student deleted successfully', {
      ...student,
      fullName: getFullName(student),
    }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete student', err.message));
  }
});

module.exports = router;