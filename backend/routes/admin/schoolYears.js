// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const verifyAdmin = require("../../middleware/authMiddleware").verifyAdmin;

// *────────────────────────────────────────────────
// * HELPERS
// *────────────────────────────────────────────────

// [HELPER] Build ISO date-string → Date, safely
const toDate = (str) => {
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${str}"`);
  return d;
};

// *────────────────────────────────────────────────
// * ACTIVATION PIPELINE
// *────────────────────────────────────────────────

/**
 * * [PIPELINE] runActivationPipeline
 *
 * Runs automatically when a school year is set as Active.
 * Performs four sequential steps:
 *
 *   Step 1 — Clone sections from the most recent prior school year into
 *             the new label. Preserves gradeLevel, curriculum, adviser,
 *             color, room, and schedule. Skips sections that already exist.
 *
 *   Step 2 — For every section, ensure LearningArea rows exist for that
 *             grade + curriculum combo. Copies from the previous year's
 *             matching sections. LearningAreas are global (not per school
 *             year) so this is a safe upsert — no duplicates created.
 *
 *   Step 3 — For every student enrolled in each section (Enrollment row
 *             for this school year), upsert an SF9Grade row per LearningArea.
 *             Grades start empty — advisers populate them during the year.
 *
 *   Step 4 — Generate SchoolForm rows (SF1, SF2, SF5) per section.
 *             Skips duplicates via unique([sectionId, schoolYear, type]).
 *
 * @param {string} schoolYearLabel  e.g. "2025-2026"
 * @param {object} db               prisma client (or tx client)
 * @returns {object}                result summary counts for the UI modal
 */
const runActivationPipeline = async (schoolYearLabel, db) => {
  const result = {
    sectionsCloned: 0,
    sectionsSkipped: 0,
    learningAreas: 0,
    sf9GradesCreated: 0,
    sf9GradesSkipped: 0,
    formsCreated: 0,
    formsSkipped: 0,
  };

  // *──────────────────────────────────────────────
  // * STEP 1 — Clone sections from the previous year
  // *──────────────────────────────────────────────

  // [QUERY] Most recently created school year that is NOT the one being activated
  const previousYear = await db.schoolYear.findFirst({
    where: { label: { not: schoolYearLabel } },
    orderBy: { startDate: "desc" },
  });

  let templateSections = [];
  if (previousYear) {
    templateSections = await db.section.findMany({
      where: { schoolYear: previousYear.label },
    });
  }

  // [QUERY] Sections already created for the new school year (skip cloning these)
  const existingSections = await db.section.findMany({
    where: { schoolYear: schoolYearLabel },
    select: { gradeLevel: true, name: true },
  });
  const existingKeys = new Set(
    existingSections.map((s) => `${s.gradeLevel}::${s.name}`),
  );

  // [PROCESS] Clone each template section unless it already exists
  for (const tpl of templateSections) {
    const key = `${tpl.gradeLevel}::${tpl.name}`;
    if (existingKeys.has(key)) {
      result.sectionsSkipped++;
      continue;
    }

    await db.section.create({
      data: {
        name: tpl.name,
        gradeLevel: tpl.gradeLevel,
        curriculum: tpl.curriculum,
        schoolYear: schoolYearLabel,
        adviserId: tpl.adviserId ?? null,
        color: tpl.color ?? null,
        room: tpl.room ?? null,
        schedule: tpl.schedule ?? null,
      },
    });
    result.sectionsCloned++;
  }

  // [QUERY] Full section list for this school year (cloned + pre-existing)
  const allSections = await db.section.findMany({
    where: { schoolYear: schoolYearLabel },
  });

  // *──────────────────────────────────────────────
  // * STEP 2 — Ensure LearningArea rows exist
  // *──────────────────────────────────────────────

  // [COMPUTE] Unique gradeLevel + curriculum pairs needed by current sections
  const gradeCurriculumPairs = [
    ...new Map(
      allSections.map((s) => [`${s.gradeLevel}::${s.curriculum}`, s]),
    ).values(),
  ].map((s) => ({ gradeLevel: s.gradeLevel, curriculum: s.curriculum }));

  // [QUERY] Source LearningAreas from the previous year's sections
  let sourceAreas = [];
  if (previousYear) {
    const prevSectionMeta = await db.section.findMany({
      where: { schoolYear: previousYear.label },
      select: { gradeLevel: true, curriculum: true },
    });

    const prevPairs = [
      ...new Map(
        prevSectionMeta.map((s) => [`${s.gradeLevel}::${s.curriculum}`, s]),
      ).values(),
    ].map((s) => ({ gradeLevel: s.gradeLevel, curriculum: s.curriculum }));

    if (prevPairs.length) {
      sourceAreas = await db.learningArea.findMany({
        where: {
          OR: prevPairs.map((p) => ({
            gradeLevel: p.gradeLevel,
            curriculum: p.curriculum,
          })),
        },
      });
    }
  }

  // [PROCESS] Upsert each source LearningArea into all matching current pairs
  for (const pair of gradeCurriculumPairs) {
    const matchingAreas = sourceAreas.filter(
      (a) =>
        a.gradeLevel === pair.gradeLevel && a.curriculum === pair.curriculum,
    );

    for (const area of matchingAreas) {
      await db.learningArea.upsert({
        where: {
          name_gradeLevel_curriculum: {
            name: area.name,
            gradeLevel: area.gradeLevel,
            curriculum: area.curriculum,
          },
        },
        // [UPDATE] Sync weights in case the previous year's values were adjusted
        update: {
          writtenWorkWeight: area.writtenWorkWeight,
          performanceTaskWeight: area.performanceTaskWeight,
          quarterlyAssessmentWeight: area.quarterlyAssessmentWeight,
        },
        create: {
          name: area.name,
          gradeLevel: area.gradeLevel,
          curriculum: area.curriculum,
          writtenWorkWeight: area.writtenWorkWeight,
          performanceTaskWeight: area.performanceTaskWeight,
          quarterlyAssessmentWeight: area.quarterlyAssessmentWeight,
        },
      });
      result.learningAreas++;
    }
  }

  // *──────────────────────────────────────────────
  // * STEP 3 — Auto-create SF9Grade rows per student
  // *──────────────────────────────────────────────

  const sf9GradesData = [];

  for (const section of allSections) {
    // [QUERY] Students enrolled in this section
    const enrollments = await db.enrollment.findMany({
      where: {
        sectionId: section.id,
        schoolYear: schoolYearLabel,
      },
      select: {
        studentId: true,
      },
    });

    if (!enrollments.length) continue;

    // [QUERY] LearningAreas for this section
    const areas = await db.learningArea.findMany({
      where: {
        gradeLevel: section.gradeLevel,
        curriculum: section.curriculum,
      },
      select: {
        id: true,
      },
    });

    if (!areas.length) continue;

    // [BUILD] student × learningArea combinations
    for (const { studentId } of enrollments) {
      for (const { id: learningAreaId } of areas) {
        sf9GradesData.push({
          studentId,
          learningAreaId,
          schoolYear: schoolYearLabel,

          q1: null,
          q2: null,
          q3: null,
          q4: null,

          q1Ready: false,
          q2Ready: false,
          q3Ready: false,
          q4Ready: false,

          finalRating: null,
          remarks: null,
        });
      }
    }
  }

  // [CREATE] Bulk insert all SF9 grades
  if (sf9GradesData.length > 0) {
    const created = await db.sF9Grade.createMany({
      data: sf9GradesData,
      skipDuplicates: true,
    });

    result.sf9GradesCreated = created.count;
    result.sf9GradesSkipped = sf9GradesData.length - created.count;
  }

  // *──────────────────────────────────────────────
  // * STEP 4 — Auto-generate school forms per section
  // *──────────────────────────────────────────────
  //
  // SchoolFormType enum: SF1 | SF2 | SF5
  // One set per section per school year.
  // Skip duplicates via unique([sectionId, schoolYear, type]).

  const SECTION_FORM_TYPES = ["SF1", "SF2", "SF5"];

  for (const section of allSections) {
    for (const type of SECTION_FORM_TYPES) {
      try {
        await db.schoolForm.create({
          data: {
            sectionId: section.id,
            type,
            schoolYear: schoolYearLabel,
            status: "DRAFT",
            generatedBy: section.adviserId ?? null,
          },
        });
        result.formsCreated++;
      } catch (err) {
        if (err.code === "P2002") {
          // ! [SKIP] Already exists — unique([sectionId, schoolYear, type])
          result.formsSkipped++;
        } else {
          // ! [ERROR] Unexpected — rethrow to surface in the response
          throw err;
        }
      }
    }
  }

  return result;
};

// *────────────────────────────────────────────────
// * ROUTES
// *────────────────────────────────────────────────

// ? [GET] List all school years (sorted newest first)
// /api/admin/school-years
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const schoolYears = await prisma.schoolYear.findMany({
      orderBy: { startDate: "desc" },
      include: { quarters: { orderBy: { name: "asc" } } },
    });

    res.json(successResponse("School years retrieved", schoolYears));
  } catch (err) {
    // ! [ERROR] DB query failed
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch school years", err.message));
  }
});

// ? [GET] Get single school year by ID
// /api/admin/school-years/:id
router.get("/:id", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json(errorResponse("Invalid ID"));

  try {
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id },
      include: { quarters: { orderBy: { name: "asc" } } },
    });

    if (!schoolYear)
      return res.status(404).json(errorResponse("School year not found"));

    res.json(successResponse("School year retrieved", schoolYear));
  } catch (err) {
    // ! [ERROR] DB query failed
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch school year", err.message));
  }
});

// * [POST] Create a new school year (with optional auto-generated quarters)
// /api/admin/school-years
router.post("/", verifyAdmin, async (req, res) => {
  const { label, startDate, endDate, quarters } = req.body;

  // ! [VALIDATION] Required fields
  if (!label || !startDate || !endDate) {
    return res
      .status(400)
      .json(errorResponse("label, startDate, and endDate are required"));
  }

  let start, end;
  try {
    start = toDate(startDate);
    end = toDate(endDate);
  } catch (err) {
    return res.status(400).json(errorResponse(err.message));
  }

  // ! [VALIDATION] Date logic
  if (start >= end) {
    return res
      .status(400)
      .json(errorResponse("startDate must be before endDate"));
  }

  try {
    // [COMPUTE] Build quarter create payload if provided
    const quarterData = Array.isArray(quarters)
      ? quarters.map((q) => {
          if (q.name < 1 || q.name > 4)
            throw new Error(`Invalid quarter name: ${q.name}`);
          return {
            name: q.name,
            startDate: toDate(q.startDate),
            endDate: toDate(q.endDate),
          };
        })
      : [];

    const schoolYear = await prisma.schoolYear.create({
      data: {
        label: label.trim(),
        startDate: start,
        endDate: end,
        quarters: quarterData.length > 0 ? { create: quarterData } : undefined,
      },
      include: { quarters: { orderBy: { name: "asc" } } },
    });

    res.status(201).json(successResponse("School year created", schoolYear));
  } catch (err) {
    // ! [ERROR] Unique constraint (duplicate label)
    if (err.code === "P2002") {
      return res
        .status(409)
        .json(
          errorResponse(`A school year with label "${label}" already exists`),
        );
    }
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to create school year", err.message));
  }
});

// * [PATCH] Update label/dates OR perform an action (activate | lock)
// /api/admin/school-years/:id
router.patch("/:id", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json(errorResponse("Invalid ID"));

  const { action, label, startDate, endDate } = req.body;

  try {
    // [CHECK] School year exists
    const existing = await prisma.schoolYear.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json(errorResponse("School year not found"));

    // ! [GUARD] Locked school years cannot be modified
    if (existing.isLocked && action !== "lock" && action !== "unlock") {
      return res
        .status(403)
        .json(
          errorResponse("This school year is locked and cannot be modified"),
        );
    }

    // *──────────────────────────────────────────────
    // * ACTION: Activate
    // *──────────────────────────────────────────────
    if (action === "activate") {
      // [STEP A] Flip active flags atomically
      await prisma.$transaction([
        prisma.schoolYear.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        }),
        prisma.schoolYear.update({
          where: { id },
          data: { isActive: true },
        }),
      ]);

      // [STEP B] Run the four-step setup pipeline
      let pipelineResult;
      try {
        pipelineResult = await runActivationPipeline(existing.label, prisma);
      } catch (pipelineErr) {
        // ! [ERROR] Pipeline failed — year is active but setup is incomplete.
        //           Surface the error so the admin can investigate or re-trigger.
        console.error("[ERROR] Activation pipeline failed:", pipelineErr);
        return res
          .status(500)
          .json(
            errorResponse(
              "School year was activated but the setup pipeline encountered an error. " +
                "Some sections, grades, or forms may be missing. Check server logs.",
              pipelineErr.message,
            ),
          );
      }

      // [FETCH] Return the updated record + pipeline summary
      const updated = await prisma.schoolYear.findUnique({
        where: { id },
        include: { quarters: { orderBy: { name: "asc" } } },
      });

      return res.json(
        successResponse("School year activated", {
          schoolYear: updated,
          pipeline: pipelineResult,
        }),
      );
    }

    // *──────────────────────────────────────────────
    // * ACTION: Lock — irreversible
    // *──────────────────────────────────────────────
    if (action === "lock") {
      const updated = await prisma.schoolYear.update({
        where: { id },
        data: { isLocked: true },
        include: { quarters: { orderBy: { name: "asc" } } },
      });
      return res.json(successResponse("School year locked", updated));
    }

    // *──────────────────────────────────────────────
    // * ACTION: Unlock — re-enables editing
    // *──────────────────────────────────────────────
    if (action === "unlock") {
      // ! [GUARD] Only locked school years can be unlocked
      if (!existing.isLocked) {
        return res
          .status(400)
          .json(errorResponse("This school year is not locked"));
      }

      const updated = await prisma.schoolYear.update({
        where: { id },
        data: { isLocked: false },
        include: { quarters: { orderBy: { name: "asc" } } },
      });
      return res.json(successResponse("School year unlocked", updated));
    }

    // *──────────────────────────────────────────────
    // * ACTION: General field update (label / dates)
    // *──────────────────────────────────────────────
    const updateData = {};

    if (label && label.trim() !== existing.label)
      updateData.label = label.trim();

    if (startDate) {
      const s = toDate(startDate);
      if (s.getTime() !== existing.startDate.getTime())
        updateData.startDate = s;
    }

    if (endDate) {
      const e = toDate(endDate);
      if (e.getTime() !== existing.endDate.getTime()) updateData.endDate = e;
    }

    // ! [VALIDATION] Nothing changed
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(errorResponse("No changes detected"));
    }

    // ! [VALIDATION] Date range after update
    const newStart = updateData.startDate ?? existing.startDate;
    const newEnd = updateData.endDate ?? existing.endDate;
    if (newStart >= newEnd) {
      return res
        .status(400)
        .json(errorResponse("startDate must be before endDate"));
    }

    const updated = await prisma.schoolYear.update({
      where: { id },
      data: updateData,
      include: { quarters: { orderBy: { name: "asc" } } },
    });

    res.json(successResponse("School year updated", updated));
  } catch (err) {
    // ! [ERROR] Unique label conflict
    if (err.code === "P2002") {
      return res
        .status(409)
        .json(errorResponse("A school year with that label already exists"));
    }
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to update school year", err.message));
  }
});

// * [PUT] Replace all quarters for a school year (upsert by quarter name)
// /api/admin/school-years/:id/quarters
router.put("/:id/quarters", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json(errorResponse("Invalid ID"));

  const { quarters } = req.body;

  // ! [VALIDATION] Must supply all 4 quarters
  if (!Array.isArray(quarters) || quarters.length !== 4) {
    return res
      .status(400)
      .json(errorResponse("Exactly 4 quarters (Q1–Q4) are required"));
  }

  try {
    // [CHECK] School year exists and is not locked
    const existing = await prisma.schoolYear.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json(errorResponse("School year not found"));
    if (existing.isLocked)
      return res.status(403).json(errorResponse("This school year is locked"));

    // [COMPUTE] Parse and validate each quarter
    const parsed = quarters.map((q) => {
      const name = parseInt(q.name, 10);
      if (name < 1 || name > 4)
        throw new Error(`Invalid quarter name: ${q.name}`);
      const start = toDate(q.startDate);
      const end = toDate(q.endDate);
      if (start >= end)
        throw new Error(`Q${name}: startDate must be before endDate`);
      return { name, startDate: start, endDate: end };
    });

    // [DB] Delete existing quarters then recreate — simpler than upsert for 4 rows
    await prisma.$transaction([
      prisma.quarter.deleteMany({ where: { schoolYearId: id } }),
      prisma.quarter.createMany({
        data: parsed.map((q) => ({ ...q, schoolYearId: id })),
      }),
    ]);

    const updated = await prisma.schoolYear.findUnique({
      where: { id },
      include: { quarters: { orderBy: { name: "asc" } } },
    });

    res.json(successResponse("Quarters updated", updated));
  } catch (err) {
    if (err.message.startsWith("Q") || err.message.startsWith("Invalid")) {
      return res.status(400).json(errorResponse(err.message));
    }
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to update quarters", err.message));
  }
});

// * [DELETE] Delete a school year (only if not active and not locked)
// /api/admin/school-years/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json(errorResponse("Invalid ID"));

  try {
    const existing = await prisma.schoolYear.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json(errorResponse("School year not found"));

    // ! [GUARD] Cannot delete active school year
    if (existing.isActive) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Cannot delete the active school year. Deactivate it first.",
          ),
        );
    }

    // ! [GUARD] Cannot delete locked school year
    if (existing.isLocked) {
      return res
        .status(403)
        .json(errorResponse("Cannot delete a locked school year."));
    }

    // [DB] Quarters are cascade-deleted via Prisma schema relation
    await prisma.schoolYear.delete({ where: { id } });

    res.json(successResponse("School year deleted"));
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json(errorResponse("Failed to delete school year", err.message));
  }
});

module.exports = router;
