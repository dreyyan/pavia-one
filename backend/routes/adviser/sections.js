// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName, calculateAge } = require('../../utils/helpers');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] Retrieve adviser's sections (protected)
// /api/adviser/sections
router.get('/', verifyAdviser, async (req, res) => {
  try {
    // [1] Find the numeric adviser ID first
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true }
    });

    if (!adviser) {
      return res.status(404).json(errorResponse('Adviser not found'));
    }

    // [2] Use numeric adviser.id to fetch sections
    const sections = await prisma.section.findMany({
      where: { adviserId: adviser.id }, // numeric ID
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolYear: true,
        curriculum: true,
        color: true,
        classSize: true,
        schedule: true
      },
      orderBy: { gradeLevel: 'asc' }
    });

    if (!sections || sections.length === 0) {
      return res.status(404).json(errorResponse('No sections found for this adviser'));
    }

    res.json(successResponse('Adviser sections retrieved', sections));
  } catch (err) {
    console.error('Sections fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch adviser sections', err.message));
  }
});

// ?[GET] Retrieve a specific section by ID (protected)
// /api/adviser/sections/:id
router.get('/:id', verifyAdviser, async (req, res) => {
  const { id } = req.params; // section numeric ID

  try {
    // [1] Find numeric adviser ID first
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse('Adviser not found'));
    }

    // [2] Fetch the specific section using numeric ID and adviser ID
    const section = await prisma.section.findFirst({
      where: {
        id: Number(id),
        adviserId: adviser.id,
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolYear: true,
        curriculum: true,
        color: true,
        classSize: true,
        schedule: true,
        enrollments: {
          select: {
            student: {
              select: { sex: true },
            },
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json(errorResponse('Section not found for this adviser'));
    }

    res.json(successResponse('Section retrieved', section));
  } catch (err) {
    console.error('Section fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch section', err.message));
  }
});

// ?[GET] Students in a specific adviser section
// /api/adviser/sections/:id/students
router.get('/:id/students', verifyAdviser, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id);
    if (isNaN(sectionId)) {
      return res.status(400).json(errorResponse('Invalid section ID'));
    }

    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'lrn',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get numeric adviser ID
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse('Adviser not found'));
    }

    // Verify section belongs to adviser
    const section = await prisma.section.findFirst({
      where: { id: sectionId, adviserId: adviser.id },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        color: true
      },
    });

    if (!section) {
      return res.status(403).json(errorResponse('Unauthorized or section not found'));
    }

    // Build filter for enrollments
    const enrollmentWhere = {
      sectionId,
      student: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { nameExtension: { contains: search, mode: 'insensitive' } },
              { lrn: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };

    // Determine orderBy for Prisma (relation sorting)
    let orderBy = { student: { lrn: 'asc' } }; // default
    if (sortBy === 'lrn' || sortBy === 'firstName' || sortBy === 'lastName') {
      orderBy = { student: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' } };
    } else if (sortBy === 'fullName') {
      // fullName is derived: sort by firstName then lastName
      orderBy = {
        student: {
          firstName: sortOrder === 'desc' ? 'desc' : 'asc',
          lastName: sortOrder === 'desc' ? 'desc' : 'asc',
        },
      };
    }

    // Fetch enrollments
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: { student: true },
        skip,
        take,
        orderBy,
      }),
      prisma.enrollment.count({ where: enrollmentWhere }),
    ]);

    // Map to student objects with fullName only
    const students = enrollments.map((e) => ({
      ...e.student,
      fullName: getFullName(e.student),
    }));

    // Calculate male and female counts
    let maleCount = 0;
    let femaleCount = 0;
    students.forEach((student) => {
      if (student.sex === "MALE") maleCount++;
      else if (student.sex === "FEMALE") femaleCount++;
    });

    const totalPages = Math.ceil(total / take);

    res.json(
      successResponse('Students retrieved successfully', {
        section: {
          name: section.name,
          gradeLevel: section.gradeLevel,
          color: section.color,
          maleCount,
          femaleCount,
        },
        students,
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
    console.error('Adviser section students fetch error:', err);
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
      fullName: getFullName(e.student),
      age: calculateAge(e.student.birthDate)
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

// ?[GET] Get a specific student in a section (protected)
// /api/adviser/sections/:sectionId/students/:studentId
router.get('/:sectionId/students/:studentId', verifyAdviser, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const studentId = parseInt(req.params.studentId);

    console.log('[REQUEST] GET /api/adviser/sections/:sectionId/students/:studentId');
    console.log('Request params:', { sectionId, studentId });
    console.log('JWT adviserId from token:', req.adviserId);

    // Get numeric adviser ID
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true }
    });
    console.log('Adviser fetched:', adviser);

    if (!adviser) return res.status(404).json(errorResponse('Adviser not found'));

    // Verify section belongs to adviser
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        adviserId: adviser.id,
      },
      select: { id: true, name: true, gradeLevel: true }
    });
    console.log('Section fetched:', section);

    if (!section) return res.status(403).json(errorResponse('You do not manage this section'));

    // Fetch enrollment including address & guardian
    const enrollment = await prisma.enrollment.findFirst({
      where: { sectionId, studentId },
      include: {
        student: { include: { address: true, guardian: true } },
        section: { select: { name: true, gradeLevel: true } }
      }
    });
    console.log('Enrollment fetched:', enrollment);

    if (!enrollment) return res.status(404).json(errorResponse('Student not found in this section'));

    const s = enrollment.student;

    // Build response
    const studentResponse = {
      id: s.id,
      lrn: s.lrn,
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      nameExtension: s.nameExtension,
      fullName: getFullName(s),
      email: s.email,
      sex: s.sex,
      birthDate: s.birthDate,
      age: calculateAge(s.birthDate),
      sectionId: enrollment.sectionId,
      sectionName: enrollment.section.name,
      gradeLevel: enrollment.section.gradeLevel,
      houseNo: s.address?.streetAddress ?? "",
      barangay: s.address?.barangay ?? "",
      municipality: s.address?.municipalityCity ?? "",
      province: s.address?.province ?? "",
      fatherName: [s.guardian?.fatherLastName, s.guardian?.fatherFirstName, s.guardian?.fatherMiddleName].filter(Boolean).join(" ") || "",
      motherName: [s.guardian?.motherMaidenLastName, s.guardian?.motherMaidenFirstName, s.guardian?.motherMaidenMiddleName].filter(Boolean).join(" ") || "",
      guardianName: s.guardian?.guardianName ?? "",
      guardianRelationship: s.guardian?.guardianRelationship ?? "",
      guardianContact: s.guardian?.guardianContactNumber ?? "",
      learningModality: enrollment.learningModality ?? ""
    };

    console.log('Student response built:', studentResponse);

    res.json(successResponse('Student retrieved successfully', studentResponse));
  } catch (err) {
    console.error('Get student in section error:', err);
    res.status(500).json(errorResponse('Failed to fetch student', err.message));
  }
});

// ?[PUT] Update a specific student in a section
// /api/adviser/sections/:sectionId/students/:studentId
router.put('/:sectionId/students/:studentId', verifyAdviser, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const studentId = parseInt(req.params.studentId);

    if (isNaN(sectionId) || isNaN(studentId)) {
      return res.status(400).json(errorResponse('Invalid section or student ID'));
    }

    const {
      lastName,
      firstName,
      middleName,
      sex,
      birthDate,
      houseNo,
      street,
      sitio,
      purok,
      barangay,
      municipality,
      province,
      fatherName,
      motherName,
      guardianName,
      guardianRelationship,
      guardianContact,
      learningModality,
    } = req.body;

    // Basic validation
    const requiredFields = { lastName, firstName, sex, birthDate, learningModality };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.toString().trim() === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(errorResponse(`Missing required fields: ${missingFields.join(', ')}`));
    }

    if (guardianContact && !/^\d+$/.test(guardianContact)) {
      return res.status(400).json(errorResponse('Guardian contact must be numeric'));
    }

    // Verify adviser manages this section
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });
    if (!adviser) return res.status(404).json(errorResponse('Adviser not found'));

    const section = await prisma.section.findFirst({
      where: { id: sectionId, adviserId: adviser.id },
      select: { id: true },
    });
    if (!section) return res.status(403).json(errorResponse('You do not manage this section'));

    // Update student core info (only fields that exist in Student model)
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        lastName,
        firstName,
        middleName,
        sex,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    // Update or create address
    if (houseNo || street || sitio || purok || barangay || municipality || province) {
      await prisma.address.upsert({
        where: { studentId },
        update: {
          streetAddress: houseNo || '',
          street: street || '',
          sitio: sitio || '',
          purok: purok || '',
          barangay: barangay || '',
          municipalityCity: municipality || '',
          province: province || '',
        },
        create: {
          studentId,
          streetAddress: houseNo || '',
          street: street || '',
          sitio: sitio || '',
          purok: purok || '',
          barangay: barangay || '',
          municipalityCity: municipality || '',
          province: province || '',
        },
      });
    }

    // Update or create guardian info
    if (fatherName || motherName || guardianName || guardianRelationship || guardianContact) {
      const [fatherLastName, fatherFirstName, fatherMiddleName] = fatherName
        ? fatherName.split(' ')
        : [];
      const [motherLastName, motherFirstName, motherMiddleName] = motherName
        ? motherName.split(' ')
        : [];

      await prisma.guardian.upsert({
        where: { studentId },
        update: {
          fatherLastName: fatherLastName || '',
          fatherFirstName: fatherFirstName || '',
          fatherMiddleName: fatherMiddleName || '',
          motherMaidenLastName: motherLastName || '',
          motherMaidenFirstName: motherFirstName || '',
          motherMaidenMiddleName: motherMiddleName || '',
          guardianName: guardianName || '',
          guardianRelationship: guardianRelationship || '',
          guardianContactNumber: guardianContact || '',
        },
        create: {
          studentId,
          fatherLastName: fatherLastName || '',
          fatherFirstName: fatherFirstName || '',
          fatherMiddleName: fatherMiddleName || '',
          motherMaidenLastName: motherLastName || '',
          motherMaidenFirstName: motherFirstName || '',
          motherMaidenMiddleName: motherMiddleName || '',
          guardianName: guardianName || '',
          guardianRelationship: guardianRelationship || '',
          guardianContactNumber: guardianContact || '',
        },
      });
    }

    // Update enrollment info (learning modality)
    if (learningModality) {
      await prisma.enrollment.updateMany({
        where: { studentId, sectionId },
        data: { learningModality },
      });
    }

    res.json(successResponse('Student updated successfully', updatedStudent));
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json(errorResponse('Failed to update student', err.message));
  }
});

// ?[POST] Bulk create students and enroll them to a section
// /api/adviser/sections/:sectionId/enrollments
router.post('/:sectionId/enrollments', verifyAdviser, async (req, res) => {
  try {
    const { students, schoolYear, learningModality = 'FACE_TO_FACE' } = req.body;
    const sectionId = parseInt(req.params.sectionId);

    // ![ERROR] Validate input
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json(errorResponse('students array is required'));
    }
    if (!schoolYear) {
      return res.status(400).json(errorResponse('schoolYear is required'));
    }
    if (isNaN(sectionId)) {
      return res.status(400).json(errorResponse('Invalid section ID'));
    }

    // [1] Numeric adviser ID + keep string adviserId for createdByAdviserId
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true, adviserId: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse('Adviser not found'));
    }

    // [2] Verify adviser manages this section
    const section = await prisma.section.findFirst({
      where: { id: sectionId, adviserId: adviser.id },
      select: { id: true },
    });

    if (!section) {
      return res.status(403).json(errorResponse('You do not manage this section'));
    }

    // [3] Prepare students: check existing by LRN
    const lrns = students.map((s) => s.lrn);
    const existingStudents = await prisma.student.findMany({
      where: { lrn: { in: lrns } },
      select: { id: true, lrn: true },
    });

    const existingLrns = existingStudents.map((s) => s.lrn);
    const newStudents = students.filter((s) => !existingLrns.includes(s.lrn));

    // [4] Create new students if they don't exist
    const createdStudents = await Promise.all(
      newStudents.map((s) =>
        prisma.student.create({
          data: {
            lrn: s.lrn,
            firstName: s.firstName,
            middleName: s.middleName,
            lastName: s.lastName,
            nameExtension: s.nameExtension,
            sex: s.sex,
            email: s.email,
            birthDate: new Date(s.birthDate),
            createdByAdviserId: req.adviserId, // <- use string from token
          },
          select: { id: true, lrn: true },
        })
      )
    );

    // Merge existing + newly created students
    const allStudents = [...existingStudents, ...createdStudents];

    // [5] Check for existing enrollments in this section and school year
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: allStudents.map((s) => s.id) },
        sectionId,
        schoolYear,
      },
      select: { studentId: true },
    });

    const alreadyEnrolledIds = existingEnrollments.map((e) => e.studentId);
    const toEnroll = allStudents.filter((s) => !alreadyEnrolledIds.includes(s.id));

    if (toEnroll.length === 0) {
      return res
        .status(400)
        .json(
          errorResponse(
            'All students are already enrolled in this section for this school year'
          )
        );
    }

    // [6] Bulk create enrollments
    const createdEnrollments = await prisma.enrollment.createMany({
      data: toEnroll.map((s) => ({
        studentId: s.id,
        sectionId,
        schoolYear,
        learningModality,
      })),
      skipDuplicates: true,
    });

    // *[SUCCESS] Response
    res.json(
      successResponse('Students created and enrolled successfully', {
        totalStudentsProcessed: allStudents.length,
        studentsCreated: createdStudents.length,
        enrollmentsCreated: createdEnrollments.count,
      })
    );
  } catch (err) {
    console.error('Adviser bulk student enrollment error:', err);
    res.status(500).json(errorResponse('Failed to create students/enrollments', err.message));
  }
});

module.exports = router;