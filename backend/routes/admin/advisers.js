// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Tools
require("dotenv").config();
const jwt = require("jsonwebtoken");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const verifyAdmin = require("../../middleware/authMiddleware").verifyAdmin;

// ?[GET] List all advisers (paginated, searchable, admin-only)
// /api/admin/advisers
router.get("/", verifyAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			sortBy = "adviserId",
			sortOrder = "asc",
			search = "",
		} = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const take = parseInt(limit);

		const where = search
		? {
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ adviserId: { contains: search } },
				{ email: { contains: search, mode: "insensitive" } },
			],
			}
		: {};

		const [advisers, total] = await Promise.all([
		prisma.adviser.findMany({
			where,
			select: {
			id: true,
			adviserId: true,
			name: true,
			email: true,
			mustChangePassword: true,
			createdAt: true,
			sections: {
				select: {
				id: true,
				name: true,
				gradeLevel: true,
				schoolYear: true,
				curriculum: true,
				isAdvisory: true,
				_count: {
					select: { enrollments: true },
				},
				},
			},
			},
			orderBy: { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
			skip,
			take,
		}),
		prisma.adviser.count({ where }),
		]);

		// Format sections to include classSize
		const formattedAdvisers = advisers.map((adviser) => ({
		...adviser,
		sections: adviser.sections.map((section) => ({
			id: section.id,
			name: section.name,
			gradeLevel: section.gradeLevel,
			schoolYear: section.schoolYear,
			curriculum: section.curriculum,
			isAdvisory: section.isAdvisory,
			classSize: section._count.enrollments,
		})),
		}));

		const totalPages = Math.ceil(total / take);

		// *[SUCCESS] Advisers retrieved successfully
		res.json(
		successResponse("Advisers retrieved successfully", {
			data: formattedAdvisers,
			pagination: {
			total,
			page: parseInt(page),
			limit: take,
			totalPages,
			hasNext: parseInt(page) < totalPages,
			hasPrev: parseInt(page) > 1,
			},
		}),
		);
	} catch (err) {
		console.error("Admin advisers fetch error:", err);
		res
		.status(500)
		.json(errorResponse("Failed to fetch advisers", err.message));
	}
});

// ?[GET] Get a single adviser by adviserId or internal ID (admin-only)
// /api/admin/advisers/:identifier
router.get('/:identifier', verifyAdmin, async (req, res) => {
  const { identifier } = req.params; // can be adviserId (string) or internal ID (number)

  try {
    let where;

    // Check if identifier is a number and within Prisma Int range
    const parsedId = Number(identifier);
    if (!isNaN(parsedId) && parsedId <= 2147483647 && parsedId >= -2147483648) {
      // safe to treat as internal ID
      where = { id: parsedId };
    } else {
      // treat as adviserId
      where = { adviserId: identifier };
    }

    // *[FETCH] Get adviser and all related fields
    const adviser = await prisma.adviser.findUnique({
      where,
      select: {
        id: true,
        adviserId: true,
        name: true,
        email: true,
        password: true,
        mustChangePassword: true,
        signatureUrl: true,
        createdAt: true,
        updatedAt: true,

        sections: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            schoolYear: true,
            curriculum: true,
            _count: { select: { enrollments: true } }, // class size
          },
        },

        createdStudents: {
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
            accountStatus: true,
            mustChangePassword: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // ![ERROR] Adviser not found
    if (!adviser) {
      return res.status(404).json(errorResponse('Adviser not found'));
    }

    // *[FORMAT] Map sections to include classSize
    const adviserWithSections = {
      ...adviser,
      sections: adviser.sections.map((section) => ({
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        schoolYear: section.schoolYear,
        curriculum: section.curriculum,
        classSize: section._count.enrollments,
      })),
    };

    // *[SUCCESS] Adviser retrieved successfully
    res.json(successResponse('Adviser retrieved successfully', adviserWithSections));

  } catch (err) {
    console.error('Admin single adviser fetch error:', err);
    res.status(500).json(errorResponse('[ERROR] Failed to fetch adviser.', err.message));
  }
});

// ?[POST] Assign an adviser to a section
// /api/admin/advisers/:sectionId/assign-adviser
router.post(
  '/:sectionId/assign-adviser',
  verifyAdmin,
  async (req, res) => {
    try {
      const { sectionId } = req.params;
      const { adviserId } = req.body; // adviser internal ID

      if (!adviserId)
        return res
          .status(400)
          .json(errorResponse('adviserId is required in request body'));

      // Check if section exists
      const section = await prisma.section.findUnique({
        where: { id: parseInt(sectionId) },
        select: { id: true, name: true, adviserId: true },
      });
      if (!section)
        return res.status(404).json(errorResponse('Section not found'));

      // Check if adviser exists
      const adviser = await prisma.adviser.findUnique({
        where: { id: parseInt(adviserId) },
        select: { id: true, name: true, adviserId: true },
      });
      if (!adviser)
        return res.status(404).json(errorResponse('Adviser not found'));

      // Update section to assign adviser
      const updatedSection = await prisma.section.update({
        where: { id: section.id },
        data: { adviserId: adviser.id },
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          schoolYear: true,
          curriculum: true,
          adviser: { select: { id: true, name: true, adviserId: true } },
        },
      });

      res.json(
        successResponse('Adviser assigned to section successfully', updatedSection)
      );
    } catch (err) {
      console.error('Assign adviser to section error:', err);
      res
        .status(500)
        .json(errorResponse('Failed to assign adviser', err.message));
    }
  }
);

// ?[POST] Add adviser(s)
// /api/admin/advisers
router.post("/", verifyAdmin, async (req, res) => {
	try {
		const bcrypt = require("bcrypt");

		// Detect if body is array (bulk) or object (single)
		const advisersInput = Array.isArray(req.body) ? req.body : [req.body];

		// ![ERROR] Empty body request
		if (advisersInput.length === 0) {
		return res
			.status(400)
			.json(errorResponse("Request body cannot be empty"));
		}

		const createdAdvisers = [];
		const errors = [];

		for (const adviser of advisersInput) {
		const { adviserId, name, email, password } = adviser;

		// ![ERROR] One or more missing fields
		if (!adviserId || !name || !email || !password) {
			errors.push({
			adviserId,
			message: "Missing required fields",
			});
			continue;
		}

		// Check duplicates
		const existing = await prisma.adviser.findFirst({
			where: {
			OR: [{ email }, { adviserId }],
			},
		});

		// ![ERROR] Adviser already exists
		if (existing) {
			errors.push({
			adviserId,
			message: "Adviser already exists",
			});
			continue;
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		const newAdviser = await prisma.adviser.create({
			data: {
			adviserId,
			name,
			email,
			password: hashedPassword,
			mustChangePassword: true,
			},
			select: {
			id: true,
			adviserId: true,
			name: true,
			email: true,
			mustChangePassword: true,
			createdAt: true,
			},
		});

		createdAdvisers.push(newAdviser);
		}

		// *[SUCCESS] Adviser(s) processed successfully
		return res.status(201).json(
			successResponse("Adviser(s) processed successfully", {
				created: createdAdvisers,
				failed: errors,
			}),
		);
	} catch (err) {
		console.error("Create adviser error:", err);
		res
		.status(500)
		.json(errorResponse("Failed to create adviser(s)", err.message));
	}
});

// ?[DELETE] Delete all advisers
// /api/admin/advisers/all
router.delete("/all", verifyAdmin, async (req, res) => {
	try {
		const allAdvisers = await prisma.adviser.findMany({
			select: { id: true, adviserId: true, name: true, email: true },
		});

		// ![ERROR] No advisers found to delete
		if (!allAdvisers.length) {
			return res.status(400).json(errorResponse("No advisers to delete"));
		}

		const deletedAdvisers = [];
		for (const adviser of allAdvisers) {
			await prisma.adviser.delete({ where: { id: adviser.id } });
			deletedAdvisers.push(adviser);
		}

		// *[SUCCESS] All advisers deleted successfully
		res.json(
			successResponse("All advisers deleted successfully", deletedAdvisers),
		);
	} catch (err) {
		console.error("Delete all advisers error:", err);
			res
			.status(500)
			.json(errorResponse("Failed to delete all advisers", err.message));
	}
});

// ?[DELETE] Delete advisers
// /api/admin/advisers
router.delete("/", verifyAdmin, async (req, res) => {
	const ids = Array.isArray(req.body.ids)
		? req.body.ids.map((i) => parseInt(i))
		: [];
	if (!ids.length) {
		return res.status(400).json(errorResponse("No adviser ID(s) provided"));
	}

	const deletedAdvisers = [];
	const errors = [];

	for (const id of ids) {
		const adviser = await prisma.adviser.findUnique({
		where: { id },
		select: { id: true, adviserId: true, name: true, email: true },
		});

		// ![ERROR] No advisers found to delete
		if (!adviser) {
			errors.push({ id, message: "Adviser not found" });
			continue;
		}

		await prisma.adviser.delete({ where: { id } });
		deletedAdvisers.push(adviser);
	}

	// *[SUCCESS] Adviser(s) processed successfully
	res.json(
		successResponse("Adviser(s) processed successfully", {
			deleted: deletedAdvisers,
			failed: errors,
		}),
	);
});

// ?[DELETE] Delete an adviser
// /api/admin/advisers/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
	const { id } = req.params;

	try {
		// Check if adviser exists
		const adviser = await prisma.adviser.findUnique({
		where: { id: parseInt(id) },
		select: { id: true, adviserId: true, name: true, email: true },
		});

		// ![ERROR] Adviser not found
		if (!adviser) {
		return res.status(404).json(errorResponse("Adviser not found"));
		}

		// Delete the adviser
		await prisma.adviser.delete({
		where: { id: parseInt(id) },
		});

		// *[SUCCESS] Adviser deleted successfully
		res.json(
		successResponse("Adviser deleted successfully", {
			id: adviser.id,
			adviserId: adviser.adviserId,
			name: adviser.name,
			email: adviser.email,
		}),
		);
	} catch (err) {
		res
		.status(500)
		.json(errorResponse("Failed to delete adviser", err.message));
	}
});

module.exports = router;