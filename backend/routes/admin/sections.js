// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { getFullName } = require("../../utils/helpers");
const verifyAdmin = require("../../middleware/authMiddleware").verifyAdmin;

// ?[GET] Get all Sections
// /api/admin/sections
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      sortBy = "name",
      sortOrder = "asc",
      search = "",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    const validSortFields = ["name", "gradeLevel", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name";
    const orderDirection = sortOrder === "desc" ? "desc" : "asc";

    // [FETCH] Sections with enrollments & adviser
    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          schoolYear: true,
          createdAt: true,
          adviser: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true } },
          enrollments: {
            where: { status: "ENROLLED" },
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
            orderBy: { student: { firstName: "asc" } },
          },
        },
        orderBy: { [sortField]: orderDirection },
        skip,
        take,
      }),
      prisma.section.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    // [TRANSFORM] Enrollments → students
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

    // *[SUCCESS] Sections retrieved
    res.json(
      successResponse("Sections retrieved successfully", {
        data: formattedSections,
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
    console.error("Admin sections fetch error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch sections", err.message));
  }
});

// ?[GET] Get Section
// /api/admin/sections/:id
router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId))
      return res.status(400).json(errorResponse("Invalid section ID"));

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
          select: {
            id: true,
            studentId: true,
            schoolYear: true,
            status: true,
            learningModality: true,
          },
        },
      },
    });

    if (!section)
      return res.status(404).json(errorResponse("Section not found"));

    // *[SUCCESS] Section retrieved
    res.json(successResponse("Section retrieved successfully", section));
  } catch (err) {
    console.error("Admin single section fetch error:", err);
    res.status(500).json(errorResponse("Failed to fetch section", err.message));
  }
});

// ?[POST] Add section(s)
// /api/admin/sections
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const isSingle = !Array.isArray(req.body);
    const sectionsInput = isSingle ? [req.body] : req.body;

    if (!sectionsInput.length) {
      return res
        .status(400)
        .json(errorResponse("Request body cannot be empty"));
    }

    const createdSections = [];
    const errors = [];

    for (const section of sectionsInput) {
      const {
        name,
        adviserId,
        gradeLevel,
        schoolYear,
        color,
        schedule,
        curriculum,
      } = section;

      // [VALIDATION] Required fields
      if (!name || !adviserId || gradeLevel === undefined || !schoolYear) {
        errors.push({ name, message: "Missing required fields" });
        continue;
      }

      // [VALIDATION] Grade level
      const gradeNum = parseInt(gradeLevel);
      if (![7, 8, 9, 10].includes(gradeNum)) {
        errors.push({
          name,
          gradeLevel,
          message: "Grade level must be between 7 and 10",
        });
        continue;
      }

      // [VALIDATION] School year
      const schoolYearPattern = /^(\d{4})\s-\s(\d{4})$/;
      const match = schoolYear.match(schoolYearPattern);
      if (!match || parseInt(match[2], 10) !== parseInt(match[1], 10) + 1) {
        errors.push({
          name,
          schoolYear,
          message: 'schoolYear must follow "YYYY - YYYY"',
        });
        continue;
      }

      // [VALIDATION] Duplicate section
      const existing = await prisma.section.findFirst({
        where: { name, gradeLevel: gradeNum, schoolYear },
      });
      if (existing) {
        errors.push({
          name,
          message: `Section already exists for grade ${gradeLevel} in ${schoolYear}`,
        });
        continue;
      }

      // [VALIDATION] Adviser exists
      const adviser = await prisma.adviser.findUnique({ where: { adviserId } });
      if (!adviser) {
        errors.push({ name, adviserId, message: "Adviser not found" });
        continue;
      }

      // [VALIDATION] Curriculum
      const validCurricula = ["Regular", "STE", "SPS", "SPA", "SPJ"];
      const sectionCurriculum = curriculum || "Regular";
      if (!validCurricula.includes(sectionCurriculum)) {
        errors.push({ name, curriculum, message: `Invalid curriculum` });
        continue;
      }

      // [CREATE]
      const newSection = await prisma.section.create({
        data: {
          name,
          gradeLevel: gradeNum,
          schoolYear,
          adviser: { connect: { adviserId } },
          color: color || null,
          schedule: schedule || null,
          curriculum: sectionCurriculum,
        },
      });

      const sectionWithEnrollments = await prisma.section.findUnique({
        where: { id: newSection.id },
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          schoolYear: true,
          color: true,
          schedule: true,
          createdAt: true,
          adviser: {
            select: { id: true, adviserId: true, name: true, email: true },
          },
          enrollments: { select: { id: true } },
        },
      });

      const finalSection = {
        ...sectionWithEnrollments,
        classSize: sectionWithEnrollments.enrollments.length,
      };

      delete finalSection.enrollments;
      createdSections.push(finalSection);
    }

    // ✅ RESPONSE HANDLING
    if (isSingle) {
      return res.status(201).json(
        successResponse("Section created successfully", {
          created: createdSections[0] || null,
          failed: errors,
        }),
      );
    }

    return res.status(201).json(
      successResponse("Sections processed successfully", {
        created: createdSections,
        failed: errors,
      }),
    );
  } catch (err) {
    console.error("Create section(s) error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to create section(s)", err.message));
  }
});

// ?[PUT] Update a single section
// /api/admin/sections/:id
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    if (isNaN(sectionId))
      return res.status(400).json(errorResponse("Invalid section ID"));

    const {
      name,
      gradeLevel,
      curriculum,
      adviserId,
      schoolYear,
      color,
      schedule,
    } = req.body;

    // ? Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!existingSection)
      return res.status(404).json(errorResponse("Section not found"));

    // ? Validate grade level only if provided
    let gradeNum;
    if (gradeLevel !== undefined) {
      gradeNum = parseInt(gradeLevel);
      if (![7, 8, 9, 10].includes(gradeNum)) {
        return res
          .status(400)
          .json(errorResponse("Grade level must be between 7 and 10"));
      }
    }

    // ? Validate school year format if provided
    if (schoolYear) {
      const schoolYearPattern = /^(\d{4})\s-\s(\d{4})$/;
      const match = schoolYear.match(schoolYearPattern);
      if (!match || parseInt(match[2], 10) !== parseInt(match[1], 10) + 1) {
        return res
          .status(400)
          .json(
            errorResponse(
              'schoolYear must follow "YYYY - YYYY" and increment by 1',
            ),
          );
      }
    }

    // ? Validate adviser exists if provided
    if (adviserId !== undefined && adviserId !== null) {
      const adviser = await prisma.adviser.findUnique({
        where: { adviserId: Number(adviserId) },
      });
      if (!adviser)
        return res.status(404).json(errorResponse("Adviser not found"));
    }

    // ? Validate curriculum if provided
    const validCurricula = ["Regular", "STE", "SPS", "SPA", "SPJ"];
    if (curriculum && !validCurricula.includes(curriculum)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid curriculum. Must be one of: ${validCurricula.join(", ")}`,
          ),
        );
    }

    // ? Check for duplicate section (same name, grade, school year)
    const duplicate = await prisma.section.findFirst({
      where: {
        id: { not: sectionId },
        name: name ?? existingSection.name,
        gradeLevel: gradeNum ?? existingSection.gradeLevel,
        schoolYear: schoolYear ?? existingSection.schoolYear,
      },
    });
    if (duplicate) {
      return res
        .status(400)
        .json(
          errorResponse(
            "Section already exists for this grade and school year",
          ),
        );
    }

    // ? Update section
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        name: name ?? existingSection.name,
        gradeLevel:
          gradeNum !== undefined ? gradeNum : existingSection.gradeLevel,
        curriculum: curriculum ?? existingSection.curriculum,
        adviserId:
          adviserId !== undefined
            ? adviserId
              ? Number(adviserId)
              : null
            : existingSection.adviserId,
        schoolYear: schoolYear ?? existingSection.schoolYear,
        color: color ?? existingSection.color,
        schedule: schedule ?? existingSection.schedule,
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        curriculum: true,
        adviserId: true,
        schoolYear: true,
        color: true,
        schedule: true,
      },
    });

    res.json(successResponse("Section updated successfully", updatedSection));
  } catch (err) {
    console.error("Update section error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to update section", err.message));
  }
});

// ?[POST] Assign students to a section
// /api/admin/sections/assign-students
router.post("/assign-students", verifyAdmin, async (req, res) => {
  try {
    const { sectionId, studentIds } = req.body;
    if (!sectionId || !Array.isArray(studentIds) || !studentIds.length) {
      return res
        .status(400)
        .json(errorResponse("sectionId and studentIds are required"));
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section)
      return res.status(404).json(errorResponse("Section not found"));

    const createdEnrollments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });
        if (!student) {
          errors.push({ studentId, message: "Student not found" });
          continue;
        }

        const exists = await prisma.enrollment.findFirst({
          where: { studentId, sectionId },
        });
        if (exists) {
          errors.push({ studentId, message: "Already enrolled" });
          continue;
        }

        const enrollment = await prisma.enrollment.create({
          data: {
            studentId,
            sectionId,
            status: "ENROLLED",
            schoolYear: section.schoolYear,
            learningModality: "FACE_TO_FACE",
          },
        });
        createdEnrollments.push(enrollment);
      } catch (err) {
        errors.push({ studentId, message: err.message });
      }
    }

    res.json(
      successResponse("Students assigned to section", {
        assigned: createdEnrollments,
        failed: errors,
      }),
    );
  } catch (err) {
    console.error("Assign students error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to assign students", err.message));
  }
});

// ?[DELETE] Delete all sections
// /api/admin/sections/all
router.delete("/all", verifyAdmin, async (req, res) => {
  try {
    const allSections = await prisma.section.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!allSections.length)
      return res.status(400).json(errorResponse("No sections to delete"));

    const deletedSections = [];
    const failedSections = [];

    for (const section of allSections) {
      try {
        if (section._count.enrollments)
          await prisma.enrollment.deleteMany({
            where: { sectionId: section.id },
          });
        await prisma.section.delete({ where: { id: section.id } });
        deletedSections.push({ id: section.id, name: section.name });
      } catch (err) {
        failedSections.push({
          id: section.id,
          name: section.name,
          message: err.message,
        });
      }
    }

    res.json(
      successResponse("All sections processed successfully", {
        deleted: deletedSections,
        failed: failedSections,
      }),
    );
  } catch (err) {
    console.error("Delete all sections error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to delete all sections", err.message));
  }
});

// ?[DELETE] Bulk delete sections
// /api/admin/sections
router.delete("/", verifyAdmin, async (req, res) => {
  const ids = Array.isArray(req.body.ids)
    ? req.body.ids.map((i) => parseInt(i))
    : [];
  if (!ids.length)
    return res.status(400).json(errorResponse("No section ID(s) provided"));

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
        errors.push({ id, message: "Section not found" });
        continue;
      }

      if (section._count.enrollments)
        await prisma.enrollment.deleteMany({ where: { sectionId: id } });
      await prisma.section.delete({ where: { id } });
      deletedSections.push(section);
    } catch (err) {
      errors.push({ id, message: err.message });
    }
  }

  res.json(
    successResponse("Section(s) processed successfully", {
      deleted: deletedSections,
      failed: errors,
    }),
  );
});

// ?[DELETE] Delete a single section
// /api/admin/sections/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Find section with counts of dependent records
    const section = await prisma.section.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            enrollments: true,
            schoolForms: true, // include schoolForms count
          },
        },
      },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    // Prevent deletion if there are dependencies
    if (section._count.enrollments || section._count.schoolForms) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete section. It has ${section._count.enrollments} enrollment(s) and ${section._count.schoolForms} school form(s) still assigned. Please remove them first.`,
      });
    }

    // Delete section
    await prisma.section.delete({ where: { id } });

    res.json({
      success: true,
      message: "Section deleted successfully.",
      data: { id: section.id, name: section.name },
    });
  } catch (err) {
    console.error("[DELETE SECTION ERROR]", err);

    res.status(500).json({
      success: false,
      message: "Failed to delete section. Please try again later.",
    });
  }
});

module.exports = router;
