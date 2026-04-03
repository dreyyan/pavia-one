// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Tools
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// ?[GET] Get Section Detail w/ Forms + Student Form Statuses for Adviser
// /api/adviser/forms/section/:sectionId
router.get("/section/:sectionId", verifyAdviser, async (req, res) => {
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

      const sf9Summary = s.sf9Summaries?.[0] ?? null;
      const sf10Status =
        sf9Summary?.generalAverage != null ? "COMPLETE" : "PENDING";

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
          color: section.color,
          adviser: section.adviser,
          schoolForms: section.schoolForms,
        },
        students,
      }),
    );
  } catch (err) {
    console.error("[ERROR] Fetch section detail for adviser:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch section detail", err.message));
  }
});

// ?[GET] Get all forms for adviser
// /api/adviser/forms
router.get("/", verifyAdviser, async (req, res) => {
  try {
    // --- Validate adviser ---
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser)
      return res.status(404).json(errorResponse("Adviser not found"));

    // --- Validate advisory section ---
    const section = await prisma.section.findFirst({
      where: { adviserId: adviser.id },
      select: { id: true },
    });

    if (!section)
      return res
        .status(404)
        .json(errorResponse("No advisory section assigned"));

    // --- Fetch forms ---
    const forms = await prisma.schoolForm.findMany({
      where: { sectionId: section.id },
      orderBy: { generatedAt: "desc" },
    });

    res.json(successResponse("Forms retrieved", forms));
  } catch (err) {
    console.error("[ERROR] Fetch forms:", err);
    res.status(500).json(errorResponse("Failed to fetch forms", err.message));
  }
});

// ?[POST] Create School Form
// /api/adviser/forms
router.post("/", verifyAdviser, async (req, res) => {
  try {
    const { type, schoolYear } = req.body;

    // --- Validate input ---
    if (!type || typeof type !== "string")
      return res
        .status(400)
        .json(errorResponse("Type is required and must be a string"));

    if (!schoolYear || typeof schoolYear !== "string")
      return res
        .status(400)
        .json(errorResponse("School year is required and must be a string"));

    // --- Get adviser ---
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser)
      return res.status(404).json(errorResponse("Adviser not found"));

    // --- Get advisory section ---
    const section = await prisma.section.findFirst({
      where: { adviserId: adviser.id },
      select: { id: true },
    });

    if (!section)
      return res
        .status(404)
        .json(errorResponse("No advisory section assigned"));

    // --- Prevent duplicate forms for same section & schoolYear ---
    const existingForm = await prisma.schoolForm.findFirst({
      where: {
        sectionId: section.id,
        schoolYear,
        type,
      },
    });

    if (existingForm)
      return res
        .status(409)
        .json(
          errorResponse("Form already exists for this section and school year"),
        );

    // --- Create form ---
    const form = await prisma.schoolForm.create({
      data: {
        sectionId: section.id,
        type,
        schoolYear,
        generatedBy: adviser.id,
      },
    });

    res.json(successResponse("School form created", form));
  } catch (err) {
    console.error("[ERROR] Create form:", err);
    res.status(500).json(errorResponse("Failed to create form", err.message));
  }
});

// ?[GET] Get single form
// /api/adviser/forms/:id
router.get("/:id", verifyAdviser, async (req, res) => {
  try {
    const formId = Number(req.params.id);

    // --- Validate form ID ---
    if (isNaN(formId))
      return res.status(400).json(errorResponse("Invalid form ID"));

    const form = await prisma.schoolForm.findUnique({
      where: { id: formId },
      include: { section: true },
    });

    if (!form) return res.status(404).json(errorResponse("Form not found"));

    res.json(successResponse("Form retrieved", form));
  } catch (err) {
    console.error("[ERROR] Get single form:", err);
    res.status(500).json(errorResponse("Failed to fetch form", err.message));
  }
});

// ?[PUT] Update form
// /api/adviser/forms/:id
router.put("/:id", verifyAdviser, async (req, res) => {
  try {
    const formId = Number(req.params.id);
    const { status } = req.body;

    // --- Validate input ---
    if (isNaN(formId))
      return res.status(400).json(errorResponse("Invalid form ID"));

    if (!status || typeof status !== "string")
      return res
        .status(400)
        .json(errorResponse("Status is required and must be a string"));

    const updated = await prisma.schoolForm.update({
      where: { id: formId },
      data: { status },
    });

    res.json(successResponse("Form updated", updated));
  } catch (err) {
    console.error("[ERROR] Update form:", err);
    res.status(500).json(errorResponse("Failed to update form", err.message));
  }
});

// ?[DELETE] Delete form
// /api/adviser/forms/:id
router.delete("/:id", verifyAdviser, async (req, res) => {
  try {
    const formId = Number(req.params.id);

    // --- Validate form ID ---
    if (isNaN(formId))
      return res.status(400).json(errorResponse("Invalid form ID"));

    await prisma.schoolForm.delete({
      where: { id: formId },
    });

    res.json(successResponse("Form deleted"));
  } catch (err) {
    console.error("[ERROR] Delete form:", err);
    res.status(500).json(errorResponse("Failed to delete form", err.message));
  }
});

// ?[POST] Auto-create default school forms for all sections
// /api/adviser/forms/auto-create
router.post("/auto-create", verifyAdviser, async (req, res) => {
  try {
    // --- Default form types ---
    const defaultFormTypes = ["SF1", "SF2", "SF9"];

    // --- Get all sections ---
    const sections = await prisma.section.findMany({
      select: { id: true, adviserId: true },
    });

    if (!sections.length) {
      return res.status(404).json(errorResponse("No sections found"));
    }

    // --- Current school year from request or default ---
    const { schoolYear } = req.body;
    if (!schoolYear) {
      return res.status(400).json(errorResponse("schoolYear is required"));
    }

    const createdForms = [];

    // --- Loop through sections and default form types ---
    for (const section of sections) {
      for (const type of defaultFormTypes) {
        try {
          const form = await prisma.schoolForm.create({
            data: {
              sectionId: section.id,
              type,
              schoolYear,
              generatedBy: section.adviserId || null,
            },
          });
          createdForms.push(form);
        } catch (err) {
          // Ignore duplicate forms (unique constraint)
          if (err.code !== "P2002") {
            console.error(
              `Failed to create form ${type} for section ${section.id}`,
              err,
            );
          }
        }
      }
    }

    res.json(
      successResponse("Default school forms auto-created", createdForms),
    );
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to auto-create school forms", err.message));
  }
});

module.exports = router;
