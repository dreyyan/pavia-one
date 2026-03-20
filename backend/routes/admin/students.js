// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName, isValidSex, splitFullName } = require('../../utils/helpers')
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] Get all students (paginated, searchable, admin-only)
// /api/admin/students
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'lrn', sortOrder = 'asc', search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { middleName: { contains: search, mode: 'insensitive' } },
            { nameExtension: { contains: search, mode: 'insensitive' } },
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
          motherTongue: true,
          ethnicGroup: true,
          religion: true,
          email: true,
          createdByAdviserId: true,
          createdAt: true,
          updatedAt: true,
          adviser: { select: { id: true, name: true, adviserId: true } },
          address: true,
          guardian: true,
          enrollments: {
            select: {
              id: true,
              sectionId: true,
              schoolYear: true,
              status: true,
              learningModality: true,
              learningAreas: {
                select: {
                  learningArea: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          monthlySummaries: true,
          dailyAttendances: true,
          sf9Grades: true,
          sf9Summaries: true,
          sf5Reports: true,
          sf9CoreValues: true,
        },
        orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.student.count({ where }),
    ]);

    // Split guardian names properly and flatten learning areas
    const studentsWithFullName = students.map((s) => {
      let guardian = s.guardian;

      if (guardian) {
        const father = splitFullName(guardian.fatherFirstName);
        const mother = splitFullName(guardian.motherMaidenFirstName);

        guardian = {
          ...guardian,
          fatherFirstName: father.firstName,
          fatherMiddleName: father.middleName,
          fatherLastName: father.lastName,
          motherMaidenFirstName: mother.firstName,
          motherMaidenMiddleName: mother.middleName,
          motherMaidenLastName: mother.lastName,
        };
      }

      // Map learning areas per enrollment
      const enrollmentsWithLearningAreas = s.enrollments.map((enr) => ({
        ...enr,
        learningAreas: enr.learningAreas.map((ela) => ela.learningArea),
      }));

      return {
        ...s,
        guardian,
        fullName: getFullName(s),
        enrollments: enrollmentsWithLearningAreas,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json(
      successResponse('Students retrieved successfully', {
        data: studentsWithFullName,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (err) {
    console.error('Admin students fetch error:', err);
    res.status(500).json(errorResponse('[ERROR] Failed to fetch students.', err.message));
  }
});

// ?[GET] Get Student
// /api/admin/students/:identifier
router.get('/:identifier', verifyAdmin, async (req, res) => {
  const { identifier } = req.params; // can be LRN or internal ID

  try {
    let where;

    // Check if identifier is a number and within Prisma Int range
    const parsedId = Number(identifier);
    if (!isNaN(parsedId) && parsedId <= 2147483647 && parsedId >= -2147483648) {
      // safe to treat as internal ID
      where = { id: parsedId };
    } else {
      // treat as LRN
      where = { lrn: identifier };
    }

    const student = await prisma.student.findUnique({
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
        motherTongue: true,
        ethnicGroup: true,
        religion: true,
        email: true,
        password: true,
        createdByAdviserId: true,
        accountStatus: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,

        adviser: { select: { id: true, name: true, adviserId: true } },

        address: true,
        guardian: true,

        enrollments: { select: { id: true, sectionId: true, schoolYear: true, status: true, learningModality: true } },
        monthlySummaries: true,
        dailyAttendances: true,
        sf9Grades: true,
        sf9Summaries: true,
        sf5Reports: true,
        sf9CoreValues: true,
      },
    });

    // ![ERROR] Student not found
    if (!student) {
      return res.status(404).json(errorResponse('Student not found'));
    }

    const studentWithFullName = {
      ...student,
      fullName: getFullName(student),
    };

    // *[SUCCESS] Student retrieved successfully
    res.json(successResponse('Student retrieved successfully', studentWithFullName));

  } catch (err) {
    console.error('Admin single student fetch error:', err);
    res.status(500).json(errorResponse('[ERROR] Failed to fetch student.', err.message));
  }
});

// ?[POST] Add student(s)
// /api/admin/students
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const studentsInput = Array.isArray(req.body) ? req.body : [req.body];
    if (!studentsInput.length) return res.status(400).json(errorResponse('No student data provided'));

    const createdStudents = [];
    const errors = [];

    for (const student of studentsInput) {
      const {
        lrn,
        firstName,
        middleName,
        lastName,
        nameExtension,
        email,
        password,
        sex,
        birthDate,
        sectionId,
        createdByAdviserId,
        motherTongue,
        religion,
        barangay,
        municipality,
        province,
        fatherName,
        motherMaidenName,
        learningModality,
        remarks,
      } = student;

      // ![ERROR] Missing required fields
      if (!lrn || !firstName || !lastName || !email || !password || !sex || !createdByAdviserId) {
        errors.push({ lrn, message: 'Missing required fields' });
        continue;
      }

      // ![ERROR] Invalid sex value
      if (!isValidSex(sex)) {
        errors.push({ lrn, message: 'Invalid sex value' });
        continue;
      }

      const existing = await prisma.student.findFirst({ where: { OR: [{ email }, { lrn }] } });

      // ![ERROR] Student already exists
      if (existing) {
        errors.push({ lrn, message: 'Student already exists' });
        continue;
      }

      // --- Parse birth date and calculate age ---
      const parsedBirthDate = birthDate ? new Date(birthDate) : null;
      let age = null;
      if (parsedBirthDate) {
        const today = new Date();
        age = today.getFullYear() - parsedBirthDate.getFullYear();
        if (
          today.getMonth() < parsedBirthDate.getMonth() ||
          (today.getMonth() === parsedBirthDate.getMonth() && today.getDate() < parsedBirthDate.getDate())
        ) {
          age--;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const studentData = {
        lrn,
        firstName,
        middleName: middleName || null,
        lastName,
        nameExtension: nameExtension || null,
        email,
        password: hashedPassword,
        sex: sex.toUpperCase(),
        birthDate: parsedBirthDate,
        age,
        motherTongue: motherTongue || null,
        religion: religion || null,
        barangay: barangay || null,
        municipality: municipality || 'Pavia',
        province: province || 'Iloilo',
        fatherName: fatherName || null,
        motherMaidenName: motherMaidenName || null,
        learningModality: learningModality || null,
        remarks: remarks || null,
        createdByAdviserId,
      };

      if (sectionId) {
        const section = await prisma.section.findUnique({ where: { id: sectionId } });

        // ![ERROR] Section not found
        if (!section) {
          errors.push({ lrn, sectionId, message: 'Section not found' });
          continue;
        }
        studentData.enrollments = { create: { sectionId, status: 'ENROLLED' } };
      }

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
          age: true,
          motherTongue: true,
          religion: true,
          barangay: true,
          municipality: true,
          province: true,
          fatherName: true,
          motherMaidenName: true,
          learningModality: true,
          remarks: true,
          createdAt: true,
          adviser: { select: { id: true, name: true, adviserId: true } },
          enrollments: { where: { status: 'ENROLLED' }, select: { section: { select: { id: true, name: true } } }, take: 1 },
        },
      });

      createdStudents.push({
        ...newStudent,
        fullName: getFullName(newStudent),
        section: newStudent.enrollments[0]?.section || null,
        enrollments: undefined,
      });
    }

    // *[SUCCESS] Student(s) processed successfully
    res.status(201).json(successResponse('Student(s) processed successfully', { created: createdStudents, failed: errors }));
  } catch (err) {
    console.error('Create student(s) error:', err);
    res.status(500).json(errorResponse('Failed to create student(s)', err.message));
  }
});

// ?[PUT] Update student(s)
// /api/admin/students
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const studentsInput = Array.isArray(req.body) ? req.body : [req.body];
    if (!studentsInput.length)
      return res.status(400).json(errorResponse('No student data provided'));

    const updatedStudents = [];
    const errors = [];

    // Map for converting frontend-friendly names to Prisma enum keys
    const learningModalityEnumMap = {
      "Face to Face": "FACE_TO_FACE",
      "Distance Learning": "DISTANCE_LEARNING",
      "Blended": "BLENDED",
      "Online": "ONLINE",
      "Homeschool": "HOMESCHOOL",
      "Other": "OTHER",
    };

    for (const student of studentsInput) {
      const {
        id,
        lrn,
        firstName,
        middleName,
        lastName,
        nameExtension,
        email,
        password,
        sex,
        birthDate,
        motherTongue,
        religion,
        // Address fields
        barangay,
        municipality,
        province,
        // Guardian fields
        fatherName,
        motherMaidenName,
        // Enrollment
        learningModality,
        remarks,
      } = student;

      const existing = await prisma.student.findFirst({
        where: id ? { id } : { lrn },
        include: { address: true, guardian: true, enrollments: true },
      });

      if (!existing) {
        errors.push({ lrn, id, message: 'Student not found' });
        continue;
      }

      // Hash password if provided
      let hashedPassword = existing.password;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Update student base fields
      const studentUpdate = await prisma.student.update({
        where: { id: existing.id },
        data: {
          firstName: firstName || existing.firstName,
          middleName: middleName !== undefined ? middleName : existing.middleName,
          lastName: lastName || existing.lastName,
          nameExtension: nameExtension !== undefined ? nameExtension : existing.nameExtension,
          email: email || existing.email,
          password: hashedPassword,
          sex: sex ? sex.toUpperCase() : existing.sex,
          birthDate: birthDate ? new Date(birthDate) : existing.birthDate,
          motherTongue: motherTongue !== undefined ? motherTongue : existing.motherTongue,
          religion: religion !== undefined ? religion : existing.religion,
        },
      });

      // Update or create address
      const addressData = {
        streetAddress: student.streetAddress || '',
        barangay: barangay || 'Sample Barangay',
        municipalityCity: municipality || 'Pavia',
        province: province || 'Iloilo',
      };

      if (existing.address) {
        await prisma.address.update({
          where: { studentId: existing.id },
          data: addressData,
        });
      } else {
        await prisma.address.create({
          data: { studentId: existing.id, ...addressData },
        });
      }

      // Update or create guardian
      const guardianData = {
        fatherFirstName: fatherName || 'Sample Father',
        motherMaidenFirstName: motherMaidenName || 'Sample Mother',
      };

      if (existing.guardian) {
        await prisma.guardian.update({
          where: { studentId: existing.id },
          data: guardianData,
        });
      } else {
        await prisma.guardian.create({
          data: { studentId: existing.id, ...guardianData },
        });
      }

      // Update enrollment for current school year
      const enrollment = existing.enrollments[0]; // adapt if multiple
      if (enrollment) {
        const enumValue = learningModalityEnumMap[learningModality] || 'FACE_TO_FACE';
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            learningModality: enumValue,
            remarks: remarks ?? null,
          },
        });
      }

      updatedStudents.push({
        id: studentUpdate.id,
        fullName: `${studentUpdate.firstName} ${studentUpdate.lastName}`,
      });
    }

    res.json(successResponse('Student(s) updated successfully', { updated: updatedStudents, failed: errors }));
  } catch (err) {
    console.error('Update student(s) error:', err);
    res.status(500).json(errorResponse('Failed to update student(s)', err.message));
  }
});

// ?[DELETE] Delete all students
// /api/admin/students/all
router.delete('/all', verifyAdmin, async (req, res) => {
  try {
    const allStudents = await prisma.student.findMany({ select: { id: true, lrn: true, firstName: true, lastName: true, email: true } });

		// ![ERROR] No students to delete
    if (!allStudents.length) return res.status(400).json(errorResponse('No students to delete'));

    const deletedStudents = [];
    for (const student of allStudents) {
      await prisma.student.delete({ where: { id: student.id } });
      deletedStudents.push(student);
    }

		// *[SUCCESS] All students deleted successfully
    res.json(successResponse('All students deleted successfully', deletedStudents));
  } catch (err) {
    console.error('Delete all students error:', err);
    res.status(500).json(errorResponse('Failed to delete all students', err.message));
  }
});

// ?[DELETE] Delete students
// /api/admin/students
router.delete('/', verifyAdmin, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map((i) => parseInt(i)) : [];

	// ![ERROR] No student ID(s) provided
  if (!ids.length) return res.status(400).json(errorResponse('No student ID(s) provided'));

  const deletedStudents = [];
  const errors = [];

  for (const id of ids) {
    const student = await prisma.student.findUnique({ where: { id }, select: { id: true, lrn: true, firstName: true, lastName: true, email: true } });

		// ![ERROR] Student not found
    if (!student) {
      errors.push({ id, message: 'Student not found' });
      continue;
    }

    await prisma.student.delete({ where: { id } });
    deletedStudents.push(student);
  }

	// *[SUCCESS] Student(s) processed successfully
  res.json(successResponse('Student(s) processed successfully', { deleted: deletedStudents, failed: errors }));
});

// ?[DELETE] Delete a student
// /api/admin/students/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(id) }, select: { id: true, lrn: true, firstName: true, lastName: true, email: true } });

		// ![ERROR] Student not found
    if (!student) return res.status(404).json(errorResponse('Student not found'));

    await prisma.student.delete({ where: { id: parseInt(id) } });

		// *[SUCCESS] Student deleted successfully
    res.json(successResponse('Student deleted successfully', student));
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json(errorResponse('Failed to delete student', err.message));
  }
});

module.exports = router;