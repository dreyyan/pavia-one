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

// ?[GET] Get All Advisers (Paginated, Searchable)
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
router.get("/:identifier", verifyAdmin, async (req, res) => {
  const { identifier } = req.params;

  try {
    let where;

    // Check if identifier is a number and within Prisma Int range
    const parsedId = Number(identifier);
    if (!isNaN(parsedId) && parsedId <= 2147483647 && parsedId >= -2147483648) {
      where = { id: parsedId };
    } else {
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
            _count: { select: { enrollments: true } },
          },
        },

        students: {
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
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // ![ERROR] Adviser not found
    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
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
    res.json(
      successResponse("Adviser retrieved successfully", adviserWithSections),
    );
  } catch (err) {
    console.error("Admin single adviser fetch error:", err);
    res
      .status(500)
      .json(errorResponse("[ERROR] Failed to fetch adviser.", err.message));
  }
});

// ?[POST] Assign Adviser to Section
// /api/admin/advisers/:sectionId/assign-adviser
router.post("/:sectionId/assign-adviser", verifyAdmin, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { adviserId } = req.body;

    if (!adviserId)
      return res
        .status(400)
        .json(errorResponse("adviserId is required in request body"));

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: parseInt(sectionId) },
      select: { id: true, name: true, adviserId: true },
    });
    if (!section)
      return res.status(404).json(errorResponse("Section not found"));

    // Check if adviser exists
    const adviser = await prisma.adviser.findUnique({
      where: { id: parseInt(adviserId) },
      select: { id: true, name: true, adviserId: true },
    });
    if (!adviser)
      return res.status(404).json(errorResponse("Adviser not found"));

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
      successResponse(
        "Adviser assigned to section successfully",
        updatedSection,
      ),
    );
  } catch (err) {
    console.error("Assign adviser to section error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to assign adviser", err.message));
  }
});

// ?[POST] Add Adviser(s)
// /api/admin/advisers
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const bcrypt = require("bcrypt");

    // Detect if body is an array (bulk) or object (single)
    const advisersInput = Array.isArray(req.body) ? req.body : [req.body];

    // ![ERROR] Empty body request
    if (advisersInput.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty",
      });
    }

    const createdAdvisers = [];
    const errors = [];

    for (const adviser of advisersInput) {
      const { adviserId, name, email } = adviser;

      // ![ERROR] Missing required fields
      if (!adviserId || !name || !email) {
        errors.push({
          adviserId: adviserId || null,
          message: "Missing required fields",
        });
        continue;
      }

      // Check for existing adviser
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
      const defaultPassword =
        process.env.DEFAULT_ADVISER_PASSWORD || "password123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Create adviser
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

    // ![ERROR] All failed
    if (createdAdvisers.length === 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]?.message || "Failed to create adviser(s)",
      });
    }

    // ?[PARTIAL SUCCESS]
    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: "Some advisers could not be created",
        data: {
          created: createdAdvisers,
          failed: errors,
        },
      });
    }

    // *[SUCCESS] All created
    return res.status(201).json({
      success: true,
      message: "Adviser(s) created successfully",
      data: createdAdvisers,
    });
  } catch (err) {
    console.error("Create adviser error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create adviser(s)",
    });
  }
});

// ?[PUT] Update Adviser Information
// /api/admin/advisers/:id
router.put("/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    middleName = "",
    lastName,
    nameExtension = "",
    email,
    sex,
    nationality,
    contactNumber,
    signatureUrl,
  } = req.body;

  if (!firstName || !lastName) {
    return res
      .status(400)
      .json(errorResponse("First name and last name are required"));
  }

  try {
    // Check if adviser exists
    const adviser = await prisma.adviser.findUnique({
      where: { id: parseInt(id) },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // Construct the full name for the DB
    const nameParts = [firstName];
    if (middleName) nameParts.push(middleName);
    nameParts.push(lastName);
    if (nameExtension) nameParts.push(nameExtension);
    const fullName = nameParts.join(" ");

    // Prepare data object dynamically (only include provided fields)
    const updateData = { name: fullName };
    if (email) updateData.email = email;
    if (sex !== undefined) updateData.sex = sex;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;

    // Update adviser
    const updatedAdviser = await prisma.adviser.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(successResponse("Adviser updated successfully", updatedAdviser));
  } catch (err) {
    console.error("Update adviser error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to update adviser", err.message));
  }
});

// ?[DELETE] Delete All Advisers
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

// ?[DELETE] Delete Advisers
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

// ?[DELETE] Delete Adviser
// /api/admin/advisers/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  console.log("[DELETE] Adviser ID:", id);

  try {
    const adviser = await prisma.adviser.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, adviserId: true, name: true, email: true },
    });

    if (!adviser) {
      return res.status(404).json(
        errorResponse("Adviser not found", {
          userFriendlyMessage: "This adviser does not exist.",
        }),
      );
    }

    await prisma.adviser.delete({ where: { id: parseInt(id) } });

    res.json(
      successResponse("Adviser deleted successfully", {
        id: adviser.id,
        adviserId: adviser.adviserId,
        name: adviser.name,
        email: adviser.email,
      }),
    );
  } catch (err) {
    console.error("[DELETE ERROR]", err);

    // ? Handle foreign key constraint
    if (err.code === "P2003") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete adviser. They are still assigned to one or more sections. Please reassign or delete the sections first.",
      });
    }

    res.status(500).json(
      errorResponse("Failed to delete adviser", {
        userFriendlyMessage:
          "Something went wrong while deleting the adviser. Please try again later.",
      }),
    );
  }
});

module.exports = router;
