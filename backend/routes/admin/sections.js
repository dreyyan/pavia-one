// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName } = require('../../utils/helpers');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] Get all Sections
// /api/admin/sections
router.get('/', verifyAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 5,
			sortBy = 'name',
			sortOrder = 'asc',
			search = '',
		} = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const take = parseInt(limit);

		const where = search
			? { name: { contains: search, mode: 'insensitive' } }
			: {};

    const validSortFields = ['name', 'gradeLevel', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';

    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          createdAt: true,
          adviser: {
            select: { id: true, name: true, email: true },
          },
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { status: 'ENROLLED' },
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
                },
              },
            },
            orderBy: { student: { firstName: 'asc' } },
          },
        },
        orderBy: { [sortField]: orderDirection },
        skip,
        take,
      }),
      prisma.section.count({ where }),
    ]);

		const totalPages = Math.ceil(total / take);

		// Transform enrollments → students array
		const formattedSections = sections.map((section) => ({
			...section,
			classSize: section._count.enrollments,
			students: section.enrollments.map((e) => ({
				...e.student,
				fullName: getFullName(e.student),
			})),
			enrollments: undefined,
			_count: undefined,
		}));

		// *[SUCCESS] Sections retrieved successfully
		res.json(
			successResponse('Sections retrieved successfully', {
				data: formattedSections,
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
		console.error('Admin sections fetch error:', err);
		res.status(500).json(errorResponse('Failed to fetch sections', err.message));
	}
});

// ?[GET] Get Section
// /api/admin/sections/:id
router.get('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const sectionId = parseInt(id, 10);
    if (isNaN(sectionId)) {
      return res.status(400).json(errorResponse('Invalid section ID'));
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        adviserId: true,
        schoolYear: true,
        curriculum: true,
        createdAt: true,
        updatedAt: true,
        adviser: { select: { id: true, name: true, adviserId: true } },
        enrollments: {
          select: { id: true, studentId: true, schoolYear: true, status: true, learningModality: true },
        },
        dailyTotals: true,
      },
    });

    // ![ERROR] Section not found
    if (!section) {
      return res.status(404).json(errorResponse('Section not found'));
    }

    // *[SUCCESS] Section retrieved successfully
    res.json(successResponse('Section retrieved successfully', section));
  } catch (err) {
    console.error('Admin single section fetch error:', err);
    res.status(500).json(errorResponse('[ERROR] Failed to fetch section.', err.message));
  }
});

// ?[POST] Add section(s)
// /api/admin/sections
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const sectionsInput = Array.isArray(req.body) ? req.body : [req.body];

    if (sectionsInput.length === 0) {
      return res.status(400).json(errorResponse('Request body cannot be empty'));
    }

    const createdSections = [];
    const errors = [];

    for (const section of sectionsInput) {
      const { name, adviserId, gradeLevel, schoolYear, color, schedule, isAdvisory, curriculum } = section;

      if (!name || !adviserId || gradeLevel === undefined || !schoolYear) {
        errors.push({ name, message: 'Missing required fields' });
        continue;
      }

      if (![7, 8, 9, 10].includes(parseInt(gradeLevel))) {
        errors.push({ name, gradeLevel, message: 'gradeLevel must be between 7 and 10' });
        continue;
      }

      const schoolYearPattern = /^(\d{4})\s-\s(\d{4})$/;
      const match = schoolYear.match(schoolYearPattern);
      if (!match) {
        errors.push({ name, schoolYear, message: 'schoolYear must follow "YYYY - YYYY"' });
        continue;
      }

      if (parseInt(match[2], 10) !== parseInt(match[1], 10) + 1) {
        errors.push({ name, schoolYear, message: 'schoolYear must increment by 1, e.g., "2025 - 2026"' });
        continue;
      }

      const existing = await prisma.section.findFirst({
        where: { name, gradeLevel: parseInt(gradeLevel), schoolYear },
      });
      if (existing) {
        errors.push({ name, message: `Section already exists for grade level ${gradeLevel} in ${schoolYear}` });
        continue;
      }

      const adviser = await prisma.adviser.findUnique({ where: { adviserId } });
      if (!adviser) {
        errors.push({ name, adviserId, message: 'Adviser not found' });
        continue;
      }

      // Validate curriculum
      const validCurricula = ['Regular', 'STE', 'SPS', 'SPA', 'SPJ'];
      const sectionCurriculum = curriculum || 'Regular';

      if (!validCurricula.includes(sectionCurriculum)) {
        errors.push({ name, curriculum, message: `Invalid curriculum. Must be one of: ${validCurricula.join(', ')}` });
        continue;
      }

      // [1] Create the section first
      const newSection = await prisma.section.create({
        data: {
          name,
          gradeLevel: parseInt(gradeLevel),
          schoolYear,
          adviser: { connect: { adviserId } },
          color: color || null,
          schedule: schedule || null,
          isAdvisory: isAdvisory || false,
          curriculum: sectionCurriculum
        },
      });

      // [2] Fetch it including enrollments to calculate classSize
      const newSectionWithEnrollments = await prisma.section.findUnique({
        where: { id: newSection.id },
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          schoolYear: true,
          color: true,
          schedule: true,
          isAdvisory: true,
          createdAt: true,
          adviser: {
            select: { id: true, adviserId: true, name: true, email: true },
          },
          enrollments: { select: { id: true } }, // include enrollments
        },
      });

      const sectionWithClassSize = {
        ...newSectionWithEnrollments,
        classSize: newSectionWithEnrollments.enrollments.length,
      };
      delete sectionWithClassSize.enrollments;

      createdSections.push(sectionWithClassSize);
    }

    res.status(201).json(
      successResponse('Section(s) processed successfully', {
        created: createdSections,
        failed: errors,
      })
    );
  } catch (err) {
    console.error('Create section(s) error:', err);
    res.status(500).json(errorResponse('Failed to create section(s)', err.message));
  }
});

// ?[POST] Assign existing students to a section
// /api/admin/sections/assign-students
router.post('/assign-students', verifyAdmin, async (req, res) => {
  try {
    const { sectionId, studentIds } = req.body;

    if (!sectionId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json(errorResponse('sectionId and studentIds are required'));
    }

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json(errorResponse('Section not found'));
    }

    const createdEnrollments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
          errors.push({ studentId, message: 'Student not found' });
          continue;
        }

        const existingEnrollment = await prisma.enrollment.findFirst({
          where: { studentId, sectionId },
        });
        if (existingEnrollment) {
          errors.push({ studentId, message: 'Student already enrolled in this section' });
          continue;
        }

        const enrollment = await prisma.enrollment.create({
          data: {
            studentId,
            sectionId,
            status: 'ENROLLED',
            schoolYear: section.schoolYear,
			      learningModality: "FACE_TO_FACE"
          },
        });

        createdEnrollments.push(enrollment);
      } catch (err) {
        errors.push({ studentId, message: err.message });
      }
    }

    res.json(
      successResponse('Students assigned to section', {
        assigned: createdEnrollments,
        failed: errors,
      })
    );
  } catch (err) {
    console.error('Assign students error:', err);
    res.status(500).json(errorResponse('Failed to assign students', err.message));
  }
});

// ?[DELETE] Delete all sections
// /api/admin/sections/all
router.delete('/all', verifyAdmin, async (req, res) => {
  try {
    const allSections = await prisma.section.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!allSections.length) {
      return res.status(400).json(errorResponse('No sections to delete'));
    }

    const deletedSections = [];
    const failedSections = [];

    for (const section of allSections) {
      try {
        if (section._count.enrollments > 0) {
          await prisma.enrollment.deleteMany({ where: { sectionId: section.id } });
        }

        await prisma.section.delete({ where: { id: section.id } });

        deletedSections.push({
          id: section.id,
          name: section.name,
        });
      } catch (err) {
        failedSections.push({
          id: section.id,
          name: section.name,
          message: err.message,
        });
      }
    }

    res.json(
      successResponse('All sections processed successfully', {
        deleted: deletedSections,
        failed: failedSections,
      })
    );
  } catch (err) {
    console.error('Delete all sections error:', err);
    res.status(500).json(errorResponse('Failed to delete all sections', err.message));
  }
});

// ?[DELETE] Delete Sections
// /api/admin/sections
router.delete('/', verifyAdmin, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i => parseInt(i)) : [];
  if (!ids.length) {
    return res.status(400).json(errorResponse('No section ID(s) provided'));
  }

  const deletedSections = [];
  const errors = [];

  for (const id of ids) {
    try {
      const section = await prisma.section.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          _count: { select: { enrollments: true } },
        },
      });

      if (!section) {
        errors.push({ id, message: 'Section not found' });
        continue;
      }

      if (section._count.enrollments > 0) {
        await prisma.enrollment.deleteMany({ where: { sectionId: section.id } });
      }

      await prisma.section.delete({ where: { id } });
      deletedSections.push(section);
    } catch (err) {
      errors.push({ id, message: err.message });
    }
  }

  res.json(
    successResponse('Section(s) processed successfully', {
      deleted: deletedSections,
      failed: errors,
    })
  );
});

// ?[DELETE] Delete a Section
// /api/admin/sections/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const section = await prisma.section.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!section) {
      return res.status(404).json(errorResponse('Section not found'));
    }

    if (section._count.enrollments > 0) {
      await prisma.enrollment.deleteMany({ where: { sectionId: section.id } });
    }

    await prisma.section.delete({ where: { id } });

    res.json(
      successResponse('Section deleted successfully', {
        id: section.id,
        name: section.name,
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse('Failed to delete section', err.message));
  }
});

module.exports = router;