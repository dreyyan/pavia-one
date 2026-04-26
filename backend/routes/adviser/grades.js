// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Tools
const { successResponse, errorResponse } = require("../../utils/response");
const { updateGeneralAverage } = require("../../utils/helpers");
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// [CONSTANTS]
const ALLOWED_ITEM_TYPES = [
  "WRITTEN_WORK",
  "PERFORMANCE_TASK",
  "QUARTERLY_ASSESSMENT",
];

const ALLOWED_QUARTERS = ["q1", "q2", "q3", "q4"];

// ?[GET] Get Student Grades
// /api/adviser/grades/sf9/:studentId
router.get("/sf9/:studentId", verifyAdviser, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    if (type && !ALLOWED_ITEM_TYPES.includes(type)) {
      return res.status(400).json(errorResponse("Invalid type"));
    }

    const grades = await prisma.sF9Grade.findMany({
      where: { studentId: Number(studentId) },
      include: {
        learningArea: true,
        items: type ? { where: { type } } : true,
      },
      orderBy: { learningAreaId: "asc" },
    });

    if (!grades.length) {
      return res.status(404).json(errorResponse("No SF9 grades found"));
    }

    const summary = await prisma.sF9Summary.findUnique({
      where: {
        studentId_schoolYear: {
          studentId: Number(studentId),
          schoolYear: grades[0].schoolYear,
        },
      },
    });

    res.json(
      successResponse("SF9 grades retrieved", {
        generalAverage: summary?.generalAverage ?? null,
        grades,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to fetch SF9 grades", err.message));
  }
});

// ?[GET] Section Grades Summary
// /api/adviser/grades/section/:sectionId
router.get("/section/:sectionId", verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.params;

    const students = await prisma.student.findMany({
      where: {
        enrollments: { some: { sectionId: Number(sectionId) } },
      },
      include: {
        sf9Summaries: {
          orderBy: { id: "desc" },
        },
      },
      orderBy: { lastName: "asc" },
    });

    const responseData = students.map((s) => {
      const summary = s.sf9Summaries?.[0];
      const avg = summary?.generalAverage ?? null;

      return {
        id: s.id,
        lrn: s.lrn,
        fullName: `${s.firstName} ${s.lastName}`,
        average: avg,
        remarks: avg !== null ? (avg >= 75 ? "PASSED" : "FAILED") : null,
      };
    });

    res.json({
      success: true,
      message: "Section grades retrieved",
      data: responseData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch section grades",
      data: err.message,
    });
  }
});

// ?[POST] Add SF9 Grade(s)
// /api/adviser/grades/sf9
router.post("/sf9", verifyAdviser, async (req, res) => {
  try {
    let { grades } = req.body;
    if (!Array.isArray(grades)) grades = [grades];

    if (!grades.length) {
      return res.status(400).json(errorResponse("grades array required"));
    }

    const ops = grades.map((g) => {
      if (g.q1 || g.q2 || g.q3 || g.q4 || g.finalRating) {
        throw new Error("Manual quarter grades not allowed");
      }

      return prisma.sF9Grade.upsert({
        where: {
          studentId_learningAreaId_schoolYear: {
            studentId: g.studentId,
            learningAreaId: g.learningAreaId,
            schoolYear: g.schoolYear,
          },
        },
        update: {},
        create: {
          studentId: g.studentId,
          learningAreaId: g.learningAreaId,
          schoolYear: g.schoolYear,
        },
      });
    });

    const result = await prisma.$transaction(ops);
    res.json(successResponse("SF9 grades created", result));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to create SF9 grades", err.message));
  }
});

// ?[GET] Get quarter lock status for SF9
// /api/adviser/grades/sf9/:gradeId/quarter-status
router.get("/sf9/:gradeId/quarter-status", verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;

    const grade = await prisma.sF9Grade.findUnique({
      where: { id: Number(gradeId) },
      select: {
        q1Ready: true,
        q2Ready: true,
        q3Ready: true,
        q4Ready: true,
      },
    });

    if (!grade) {
      return res.status(404).json(errorResponse("Grade not found"));
    }

    res.json(
      successResponse("Quarter status fetched", {
        1: grade.q1Ready,
        2: grade.q2Ready,
        3: grade.q3Ready,
        4: grade.q4Ready,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to fetch quarter status", err.message));
  }
});

// ?[PATCH] Finalize / Unfinalize Quarter
// /api/adviser/grades/sf9/:gradeId/quarter-ready
router.patch("/sf9/:gradeId/quarter-ready", verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { quarter, ready } = req.body;

    if (!ALLOWED_QUARTERS.includes(quarter)) {
      return res.status(400).json(errorResponse("Invalid quarter"));
    }

    const grade = await prisma.sF9Grade.findUnique({
      where: { id: Number(gradeId) },
      include: { learningArea: true },
    });

    if (!grade) {
      return res.status(404).json(errorResponse("Grade not found"));
    }

    const quarterNum = Number(quarter.slice(1));
    const flag = `${quarter}Ready`;

    if (grade[flag] === ready) {
      return res.json(successResponse("Quarter already updated", grade));
    }

    const updateData = { [flag]: ready };

    if (ready) {
      const items = await prisma.sF9GradeItem.findMany({
        where: { sf9GradeId: Number(gradeId), quarter: quarterNum },
      });

      if (!items.length) {
        return res
          .status(400)
          .json(errorResponse("Cannot lock quarter: no items"));
      }

      const grouped = {
        WRITTEN_WORK: [],
        PERFORMANCE_TASK: [],
        QUARTERLY_ASSESSMENT: [],
      };

      items.forEach((i) => grouped[i.type]?.push(i));

      const getPS = (arr) => {
        const total = arr.reduce((s, i) => s + (i.score ?? 0), 0);
        const max = arr.reduce((s, i) => s + (i.maxScore ?? 0), 0);
        return max ? (total / max) * 100 : 0;
      };

      const la = grade.learningArea || {};
      const ww = la.writtenWorkWeight ?? 30;
      const pt = la.performanceTaskWeight ?? 50;
      const qa = la.quarterlyAssessmentWeight ?? 20;

      const total = ww + pt + qa;

      const score = Math.round(
        getPS(grouped.WRITTEN_WORK) * (ww / total) +
          getPS(grouped.PERFORMANCE_TASK) * (pt / total) +
          getPS(grouped.QUARTERLY_ASSESSMENT) * (qa / total),
      );

      updateData[quarter] = score;
    } else {
      updateData[quarter] = null;
    }

    const quarters = ["q1", "q2", "q3", "q4"].map((q) =>
      q === quarter ? updateData[q] : grade[q],
    );

    const complete = quarters.every((v) => typeof v === "number");

    updateData.finalRating = complete
      ? Math.round(quarters.reduce((a, b) => a + b, 0) / 4)
      : null;

    updateData.remarks = complete
      ? updateData.finalRating >= 75
        ? "PASSED"
        : "FAILED"
      : null;

    const updated = await prisma.sF9Grade.update({
      where: { id: Number(gradeId) },
      data: updateData,
    });

    await updateGeneralAverage(updated.studentId, updated.schoolYear);

    res.json(successResponse("Quarter lock status updated", updated));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to update quarter", err.message));
  }
});

// ?[GET] Get quarter lock status for student
// /api/adviser/grades/sf9/:studentId/quarter-status
router.get(
  "/sf9/:studentId/quarter-status",
  verifyAdviser,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const grades = await prisma.sF9Grade.findMany({
        where: { studentId: Number(studentId) },
        select: {
          q1Ready: true,
          q2Ready: true,
          q3Ready: true,
          q4Ready: true,
        },
      });

      if (!grades.length) {
        return res.json(successResponse("No grades", {}));
      }

      res.json(
        successResponse("Student quarter status fetched", {
          1: grades.every((g) => g.q1Ready),
          2: grades.every((g) => g.q2Ready),
          3: grades.every((g) => g.q3Ready),
          4: grades.every((g) => g.q4Ready),
        }),
      );
    } catch (err) {
      res
        .status(500)
        .json(errorResponse("Failed to fetch quarter status", err.message));
    }
  },
);

// ?[POST] Add Grade Item(s)
// /api/adviser/grades/sf9/item
router.post("/sf9/item", verifyAdviser, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];

    const created = await prisma.$transaction(
      items.map((i) =>
        prisma.sF9GradeItem.create({
          data: {
            sf9GradeId: i.sf9GradeId,
            quarter: Number(i.quarter),
            type: i.type,
            score: i.score,
            maxScore: i.maxScore,
          },
        }),
      ),
    );

    res.json(successResponse("Items created", created));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to create items", err.message));
  }
});

// ?[PUT] Update grade item
// /api/adviser/grades/sf9/item/:itemId
router.put("/sf9/item/:itemId", verifyAdviser, async (req, res) => {
  try {
    const { itemId } = req.params;

    const updated = await prisma.sF9GradeItem.update({
      where: { id: Number(itemId) },
      data: req.body,
    });

    res.json(successResponse("Item updated", updated));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to update item", err.message));
  }
});

// ?[DELETE] Delete ALL SF9 Grades
// /api/adviser/grades/sf9/delete-all
router.delete("/sf9/delete-all", verifyAdviser, async (req, res) => {
  try {
    const { schoolYear, confirm } = req.body;

    if (!confirm) {
      return res
        .status(400)
        .json(errorResponse("Confirmation required (confirm: true)"));
    }

    const gradeWhere = schoolYear ? { schoolYear } : {};

    const grades = await prisma.sF9Grade.findMany({
      where: gradeWhere,
      select: { id: true },
    });

    const gradeIds = grades.map((g) => g.id);

    if (!gradeIds.length) {
      return res.json(
        successResponse("No SF9 grades found", {
          itemsDeleted: 0,
          gradesDeleted: 0,
        }),
      );
    }

    const deletedItems = await prisma.sF9GradeItem.deleteMany({
      where: {
        sf9GradeId: { in: gradeIds },
      },
    });

    const deletedGrades = await prisma.sF9Grade.deleteMany({
      where: {
        id: { in: gradeIds },
      },
    });

    await prisma.sF9Summary.deleteMany({
      where: gradeWhere,
    });

    return res.json(
      successResponse("All SF9 grades deleted", {
        itemsDeleted: deletedItems.count,
        gradesDeleted: deletedGrades.count,
      }),
    );
  } catch (err) {
    return res
      .status(500)
      .json(errorResponse("Failed to delete all SF9 grades", err.message));
  }
});

// ?[DELETE] Grade items
// /api/adviser/grades/sf9/item
router.delete("/sf9/item", verifyAdviser, async (req, res) => {
  try {
    const itemIds = Array.isArray(req.body.itemIds)
      ? req.body.itemIds
      : [req.body.itemIds];

    await prisma.sF9GradeItem.deleteMany({
      where: { id: { in: itemIds.map(Number) } },
    });

    res.json(successResponse("Items deleted"));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to delete items", err.message));
  }
});

// ?[DELETE] SF9 grade
// /api/adviser/grades/sf9/:gradeId
router.delete("/sf9/:gradeId", verifyAdviser, async (req, res) => {
  try {
    const grade = await prisma.sF9Grade.findUnique({
      where: { id: Number(req.params.gradeId) },
    });

    if (!grade) {
      return res.status(404).json(errorResponse("Grade not found"));
    }

    const locked = ALLOWED_QUARTERS.some((q) => grade[`${q}Ready`]);

    if (locked) {
      return res
        .status(400)
        .json(errorResponse("Cannot delete finalized grade"));
    }

    await prisma.sF9Grade.delete({
      where: { id: Number(req.params.gradeId) },
    });

    res.json(successResponse("Grade deleted"));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to delete grade", err.message));
  }
});

module.exports = router;
