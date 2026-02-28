// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { getFullName } = require('../../utils/helpers');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] List all sections
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

		const [sections, total] = await Promise.all([
			prisma.section.findMany({
				where,
				select: {
					id: true,
					name: true,
					gradeLevel: true,
					createdAt: true,
					adviser: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},

					// Count enrollments instead of students
					_count: {
						select: { enrollments: true },
					},

					// Get students through enrollments
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
									accountStatus: true,
								},
							},
						},
						orderBy: {
							student: {
								firstName: 'asc',
							},
						},
					},
				},
				orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
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

// ?[POST] Create section(s)
// /api/admin/sections
router.post('/', verifyAdmin, async (req, res) => {
	try {
		// Accept single object or array
		const sectionsInput = Array.isArray(req.body) ? req.body : [req.body];

		// ![ERROR] Empty body request
		if (sectionsInput.length === 0) {
			return res.status(400).json(errorResponse('Request body cannot be empty'));
		}

		const createdSections = [];
		const errors = [];

		for (const section of sectionsInput) {
			const { name, adviserId, gradeLevel, schoolYear } = section;

			// ![ERROR] One or more missing fields
			if (!name || !adviserId || gradeLevel === undefined || !schoolYear) {
				errors.push({ name, message: 'Missing required fields' });
				continue;
			}

			// ![ERROR] Invalid grade level
			if (![7, 8, 9, 10].includes(parseInt(gradeLevel))) {
				errors.push({ name, gradeLevel, message: 'gradeLevel must be between 7 and 10' });
				continue;
			}

			// Validate schoolYear format
			const schoolYearPattern = /^(\d{4})\s-\s(\d{4})$/;
			const match = schoolYear.match(schoolYearPattern);

			// ![ERROR] Invalid school year format
			if (!match) {
				errors.push({ name, schoolYear, message: 'schoolYear must follow "YYYY - YYYY"' });
				continue;
			}

			const startYear = parseInt(match[1], 10);
			const endYear = parseInt(match[2], 10);

			// ![ERROR] Invalid school year increment
			if (endYear !== startYear + 1) {
				errors.push({ name, schoolYear, message: 'schoolYear must increment by 1, e.g., "2025 - 2026"' });
				continue;
			}

			// Check for existing section with same name, gradeLevel, schoolYear
			const existing = await prisma.section.findFirst({
				where: {
					name,
					gradeLevel: parseInt(gradeLevel),
					schoolYear,
				},
			});

			// ![ERROR] Section already exists
			if (existing) {
				errors.push({ name, message: `Section already exists for grade level ${gradeLevel} in ${schoolYear}` });
				continue;
			}

			// Check if adviser exists
			const adviser = await prisma.adviser.findUnique({ where: { adviserId } });

			// ![ERROR] Adviser not found
			if (!adviser) {
				errors.push({ name, adviserId, message: 'Adviser not found' });
				continue;
			}

			// Create section
			const newSection = await prisma.section.create({
				data: {
					name,
					gradeLevel: parseInt(gradeLevel),
					schoolYear,
					adviser: { connect: { adviserId } },
				},
				select: {
					id: true,
					name: true,
					gradeLevel: true,
					schoolYear: true,
					createdAt: true,
					adviser: {
						select: {
							id: true,
							adviserId: true,
							name: true,
							email: true,
						},
					},
				},
			});

			createdSections.push(newSection);
		}

		// *[SUCCESS] Section(s) processed successfully
		res.status(201).json(
			successResponse('Section(s) processed successfully', {
				created: createdSections,
				failed: errors,
			})
		);
	} catch (err) {
		console.error('Create section(s) error:', err);
		res.status(500).json(
			errorResponse('Failed to create section(s)', err.message)
		);
	}
});

// ?[DELETE] Delete all sections
// /api/admin/sections/all
router.delete('/all', verifyAdmin, async (req, res) => {
	try {
		// Get all sections with enrolled student counts
		const allSections = await prisma.section.findMany({
			select: {
				id: true,
				name: true,
				_count: { select: { enrollments: true } },
			},
		});

		// ![ERROR] No sections to delete
		if (!allSections.length) {
			return res.status(400).json(errorResponse('No sections to delete'));
		}

		const deletedSections = [];
		const failedSections = [];

		// Check each section if it contains enrolled students
		for (const section of allSections) {
			// ![ERROR] Cannot delete section /w enrolled students
			if (section._count.enrollments > 0) {
				failedSections.push({
					id: section.id,
					name: section.name,
					message: 'Cannot delete section with enrolled students'
				});
				continue;
			}

			await prisma.section.delete({ where: { id: section.id } });
			deletedSections.push({
				id: section.id,
				name: section.name
			});
		}

		// *[SUCCESS] All sections processed successfully
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

// ?[DELETE] Delete multiple sections via body JSON
// /api/admin/sections
router.delete('/', verifyAdmin, async (req, res) => {
	const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i => parseInt(i)) : [];
	if (!ids.length) {
		return res.status(400).json(errorResponse('No section ID(s) provided'));
	}

	const deletedSections = [];
	const errors = [];

	for (const id of ids) {
		const section = await prisma.section.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				_count: { select: { enrollments: true } },
			},
		});

		// ![ERROR] Section not found
		if (!section) {
			errors.push({ id, message: 'Section not found' });
			continue;
		}

		// ![ERROR] Cannot delete section /w enrolled students
		if (section._count.enrollments > 0) {
			errors.push({ id, message: 'Cannot delete section with enrolled students' });
			continue;
		}

		await prisma.section.delete({ where: { id } });
		deletedSections.push(section);
	}

	// *[SUCCESS] Section(s) processed successfully
	res.json(
		successResponse('Section(s) processed successfully', {
			deleted: deletedSections,
			failed: errors,
		})
	);
});

// ?[DELETE] Delete a single section
// /api/admin/sections/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
	const id = parseInt(req.params.id, 10);

	try {
		const section = await prisma.section.findUnique({
			where: { id: parseInt(id) },
			select: {
				id: true,
				name: true,
				_count: { select: { enrollments: true } },
			},
		});

		// ![ERROR] Section not found
		if (!section) {
			return res.status(404).json(errorResponse('Section not found'));
		}

		// ![ERROR] Cannot delete section /w enrolled students
		if (section._count.enrollments > 0) {
			return res.status(400).json(
				errorResponse('Cannot delete section with enrolled students')
			);
		}

		await prisma.section.delete({ where: { id: parseInt(id) } });

		// *[SUCCESS] Section deleted successfully
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