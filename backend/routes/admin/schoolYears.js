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
    if (existing.isLocked && action !== "lock") {
      return res
        .status(403)
        .json(
          errorResponse("This school year is locked and cannot be modified"),
        );
    }

    // * [ACTION] Activate — deactivates all others in a transaction
    if (action === "activate") {
      const updated = await prisma.$transaction([
        prisma.schoolYear.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        }),
        prisma.schoolYear.update({
          where: { id },
          data: { isActive: true },
          include: { quarters: { orderBy: { name: "asc" } } },
        }),
      ]);
      return res.json(successResponse("School year activated", updated[1]));
    }

    // * [ACTION] Lock — irreversible
    if (action === "lock") {
      const updated = await prisma.schoolYear.update({
        where: { id },
        data: { isLocked: true },
        include: { quarters: { orderBy: { name: "asc" } } },
      });
      return res.json(successResponse("School year locked", updated));
    }

    // * [ACTION] General field update (label / dates)
    const updateData = {};

    if (label && label.trim() !== existing.label) {
      updateData.label = label.trim();
    }

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
    // [CHECK] Exists
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
