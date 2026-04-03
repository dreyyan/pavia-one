// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { verifyAdmin } = require("../../middleware/authMiddleware");

// ?[GET] Get All Sections w/ Respective School Forms
// /api/admin/school-forms
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const { schoolYear } = req.query;

    const sections = await prisma.section.findMany({
      where: schoolYear ? { schoolYear: String(schoolYear) } : undefined,
      orderBy: [{ schoolYear: "desc" }, { gradeLevel: "asc" }, { name: "asc" }],
      include: {
        adviser: {
          select: { id: true, adviserId: true, name: true, email: true },
        },
        schoolForms: {
          orderBy: { type: "asc" },
        },
        enrollments: {
          where: { status: "ENROLLED" },
          select: { id: true },
        },
      },
    });

    res.json(successResponse("Sections with forms retrieved", { sections }));
  } catch (err) {
    console.error("[ERROR] Fetch sections with forms:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch sections", err.message));
  }
});

// ?[GET] Get Section Detail w/ Forms + Student Form Statuses
// /api/admin/school-forms/section/:sectionId
router.get("/section/:sectionId", verifyAdmin, async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId))
      return res.status(400).json(errorResponse("Invalid section ID"));

    // --- Section + adviser + school forms ---
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        adviser: {
          select: { id: true, adviserId: true, name: true, email: true },
        },
        schoolForms: {
          orderBy: { type: "asc" },
        },
      },
    });

    if (!section)
      return res.status(404).json(errorResponse("Section not found"));

    // --- Enrolled students with their SF9 grades and SF5 reports ---
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId, schoolYear: section.schoolYear },
      include: {
        student: {
          select: {
            id: true,
            lrn: true,
            firstName: true,
            middleName: true,
            lastName: true,
            nameExtension: true,
            sex: true,
            sf9Grades: {
              where: { schoolYear: section.schoolYear },
              select: {
                id: true,
                learningAreaId: true,
                q1: true,
                q2: true,
                q3: true,
                q4: true,
                q1Ready: true,
                q2Ready: true,
                q3Ready: true,
                q4Ready: true,
                finalRating: true,
                remarks: true,
              },
            },
            sf9Summaries: {
              where: { schoolYear: section.schoolYear },
              select: { id: true, generalAverage: true },
            },
            sf5Reports: {
              select: { id: true, generalAverage: true, actionTaken: true },
            },
          },
        },
      },
      orderBy: { student: { lastName: "asc" } },
    });

    // --- Derive per-student form statuses ---
    const students = enrollments.map((e) => {
      const s = e.student;

      // SF9: consider "ready" if all quarters have at least one grade marked ready
      const sf9Grades = s.sf9Grades ?? [];
      const allReady =
        sf9Grades.length > 0 &&
        sf9Grades.every(
          (g) => g.q1Ready && g.q2Ready && g.q3Ready && g.q4Ready,
        );
      const partialReady =
        sf9Grades.length > 0 &&
        sf9Grades.some((g) => g.q1Ready || g.q2Ready || g.q3Ready || g.q4Ready);

      const sf9Status = allReady
        ? "COMPLETE"
        : partialReady
          ? "PARTIAL"
          : "PENDING";

      // SF10 (Report Card / SF9Summary): check if general average is computed
      const sf9Summary = s.sf9Summaries?.[0] ?? null;
      const sf10Status =
        sf9Summary?.generalAverage != null ? "COMPLETE" : "PENDING";

      // SF5 (Promotion report)
      const sf5Report = s.sf5Reports?.[0] ?? null;
      const sf5Status = sf5Report ? "COMPLETE" : "PENDING";

      return {
        id: s.id,
        lrn: s.lrn,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        nameExtension: s.nameExtension,
        sex: s.sex,
        enrollmentStatus: e.status,
        sf9Status,
        sf10Status,
        sf5Status,
        generalAverage: sf9Summary?.generalAverage ?? null,
        actionTaken: sf5Report?.actionTaken ?? null,
      };
    });

    res.json(
      successResponse("Section detail retrieved", {
        section: {
          id: section.id,
          name: section.name,
          gradeLevel: section.gradeLevel,
          schoolYear: section.schoolYear,
          curriculum: section.curriculum,
          adviser: section.adviser,
          schoolForms: section.schoolForms,
        },
        students,
      }),
    );
  } catch (err) {
    console.error("[ERROR] Fetch section detail:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch section detail", err.message));
  }
});

// ?[GET] Get Section's Student Form Detail
// GET /api/admin/school-forms/section/:sectionId/student/:studentId
router.get(
  "/section/:sectionId/student/:studentId",
  verifyAdmin,
  async (req, res) => {
    try {
      const sectionId = Number(req.params.sectionId);
      const studentId = Number(req.params.studentId);

      if (isNaN(sectionId) || isNaN(studentId))
        return res.status(400).json(errorResponse("Invalid ID"));

      // --- Get section's school year ---
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { schoolYear: true, name: true, gradeLevel: true },
      });
      if (!section)
        return res.status(404).json(errorResponse("Section not found"));

      // --- Get student with all form data ---
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          address: true,
          guardian: true,
          sf9Grades: {
            where: { schoolYear: section.schoolYear },
            include: {
              learningArea: {
                select: { id: true, name: true, gradeLevel: true },
              },
              items: true,
            },
          },
          sf9Summaries: {
            where: { schoolYear: section.schoolYear },
          },
          sf9CoreValues: {
            include: { coreValue: true },
          },
          sf5Reports: true,
        },
      });

      if (!student)
        return res.status(404).json(errorResponse("Student not found"));

      res.json(
        successResponse("Student form detail retrieved", { student, section }),
      );
    } catch (err) {
      console.error("[ERROR] Fetch student form detail:", err);
      res
        .status(500)
        .json(errorResponse("Failed to fetch student detail", err.message));
    }
  },
);

// ?[PUT] Update School Form's Status (Admin Approval/Locking)
// /api/admin/school-forms/:formId
router.put("/:formId", verifyAdmin, async (req, res) => {
  try {
    const formId = Number(req.params.formId);
    if (isNaN(formId))
      return res.status(400).json(errorResponse("Invalid form ID"));

    const { status } = req.body;
    const validStatuses = [
      "DRAFT",
      "GENERATED",
      "SUBMITTED",
      "APPROVED",
      "LOCKED",
    ];
    if (!status || !validStatuses.includes(status))
      return res
        .status(400)
        .json(
          errorResponse(`Status must be one of: ${validStatuses.join(", ")}`),
        );

    // --- Build timestamp fields based on new status ---
    const adminId = req.adminId;
    const timestampUpdates = {};
    if (status === "GENERATED") timestampUpdates.generatedAt = new Date();
    if (status === "SUBMITTED") timestampUpdates.submittedAt = new Date();
    if (status === "APPROVED") {
      timestampUpdates.approvedAt = new Date();
      timestampUpdates.approvedBy = adminId;
    }
    if (status === "LOCKED") timestampUpdates.lockedAt = new Date();

    const updated = await prisma.schoolForm.update({
      where: { id: formId },
      data: { status, ...timestampUpdates },
    });

    res.json(successResponse("Form status updated", { form: updated }));
  } catch (err) {
    console.error("[ERROR] Update form status:", err);
    res
      .status(500)
      .json(errorResponse("Failed to update form status", err.message));
  }
});

// ?[POST] Auto-generate default school forms for all sections in a school year
// /api/admin/school-forms/generate
router.post("/generate", verifyAdmin, async (req, res) => {
  try {
    const { schoolYear } = req.body;
    if (!schoolYear || typeof schoolYear !== "string")
      return res.status(400).json(errorResponse("schoolYear is required"));

    const sections = await prisma.section.findMany({
      where: { schoolYear },
      select: { id: true, adviserId: true },
    });

    if (!sections.length)
      return res
        .status(404)
        .json(errorResponse(`No sections found for school year ${schoolYear}`));

    const formTypes = ["SF1", "SF5"];
    const created = [];
    const skipped = [];

    for (const section of sections) {
      for (const type of formTypes) {
        try {
          const form = await prisma.schoolForm.create({
            data: {
              sectionId: section.id,
              type,
              schoolYear,
              generatedBy: section.adviserId ?? null,
            },
          });
          created.push(form);
        } catch (err) {
          // ! [SKIP] Duplicate — unique constraint (sectionId, schoolYear, type)
          if (err.code === "P2002") {
            skipped.push({ sectionId: section.id, type });
          } else {
            console.error(
              `[ERROR] Creating ${type} for section ${section.id}:`,
              err,
            );
          }
        }
      }
    }

    res.json(
      successResponse("School forms generated", {
        created: created.length,
        skipped: skipped.length,
        forms: created,
      }),
    );
  } catch (err) {
    console.error("[ERROR] Auto-generate forms:", err);
    res
      .status(500)
      .json(errorResponse("Failed to generate forms", err.message));
  }
});

// ?[DELETE] Delete all school forms
// /api/admin/school-forms
router.delete("/", verifyAdmin, async (req, res) => {
  try {
    // Delete all school forms
    const deletedForms = await prisma.schoolForm.deleteMany({});

    res.json({
      success: true,
      message: `All school forms deleted successfully (${deletedForms.count} record(s)).`,
    });
  } catch (err) {
    console.error("[ERROR] Delete all school forms:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete school forms. Please try again later.",
    });
  }
});

module.exports = router;
