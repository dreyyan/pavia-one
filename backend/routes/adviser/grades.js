// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// -----------------------------
// Constants
// -----------------------------
const ALLOWED_ITEM_TYPES = ['WRITTEN_WORK', 'PERFORMANCE_TASK', 'QUARTERLY_ASSESSMENT'];
const ALLOWED_QUARTERS = ['q1', 'q2', 'q3', 'q4'];

// -----------------------------
// [GET] Retrieve all SF9 grades for a student
// -----------------------------
router.get('/sf9/:studentId', verifyAdviser, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    if (type && !ALLOWED_ITEM_TYPES.includes(type))
      return res.status(400).json(errorResponse('Invalid type'));

    const grades = await prisma.sF9Grade.findMany({
      where: { studentId: Number(studentId) },
      include: {
        learningArea: true,
        items: {
          ...(type
            ? { where: { type } }
            : {})
        }
      },
      orderBy: { learningAreaId: 'asc' }
    });

    if (!grades.length)
      return res.status(404).json(errorResponse('No SF9 grades found'));

    res.json(successResponse('SF9 grades retrieved', grades));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch SF9 grades', err.message));
  }
});

// -----------------------------
// [GET] Section grades summary
// -----------------------------
router.get('/section/:sectionId', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.params;

    const students = await prisma.student.findMany({
      where: {
        enrollments: { some: { sectionId: Number(sectionId) } }
      },
      include: {
        sf9Grades: { select: { finalRating: true } }
      },
      orderBy: { lastName: 'asc' }
    });

    const responseData = students.map(s => {
      const valid = s.sf9Grades.filter(g => g.finalRating !== null);

      const average =
        valid.length > 0
          ? Math.round(valid.reduce((sum, g) => sum + g.finalRating, 0) / valid.length)
          : null;

      const remarks =
        average !== null
          ? average >= 75 ? 'PASSED' : 'FAILED'
          : null;

      return {
        id: s.id,
        lrn: s.lrn,
        fullName: `${s.firstName} ${s.lastName}`,
        average,
        remarks,
      };
    });

    res.json(successResponse('Section grades retrieved', responseData));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch section grades', err.message));
  }
});

// -----------------------------
// [POST] Create SF9 grades
// (manual quarter grades NOT allowed)
// -----------------------------
router.post('/sf9', verifyAdviser, async (req, res) => {
  try {
    let { grades } = req.body;
    if (!Array.isArray(grades)) grades = [grades];
    if (!grades.length)
      return res.status(400).json(errorResponse('grades array required'));

    const createOps = grades.map(g => {
      if (g.q1 || g.q2 || g.q3 || g.q4 || g.finalRating)
        throw new Error('Manual quarter grades not allowed');

      return prisma.sF9Grade.upsert({
        where: {
          studentId_learningAreaId_schoolYear: {
            studentId: g.studentId,
            learningAreaId: g.learningAreaId,
            schoolYear: g.schoolYear
          }
        },
        update: {},
        create: {
          studentId: g.studentId,
          learningAreaId: g.learningAreaId,
          schoolYear: g.schoolYear
        },
        include: { items: true }
      });
    });

    const newGrades = await prisma.$transaction(createOps);
    res.json(successResponse('SF9 grades created', newGrades));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to create SF9 grades', err.message));
  }
});

// -----------------------------
// [PATCH] Finalize / Unfinalize Quarter
// -----------------------------
router.patch('/sf9/:gradeId/quarter-ready', verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { quarter, ready } = req.body;

    if (!ALLOWED_QUARTERS.includes(quarter))
      return res.status(400).json(errorResponse('Invalid quarter'));

    const grade = await prisma.sF9Grade.findUnique({
      where: { id: Number(gradeId) },
      include: { learningArea: true }
    });

    if (!grade) return res.status(404).json(errorResponse('Grade not found'));

    const quarterNum = parseInt(quarter.slice(1));
    const quarterFlag = `${quarter}Ready`;

    if (grade[quarterFlag] && ready)
      return res.status(400).json(errorResponse('Already finalized'));

    let updateData = { [quarterFlag]: ready };

    if (ready) {
      const items = await prisma.sF9GradeItem.findMany({
        where: { sf9GradeId: Number(gradeId), quarter: quarterNum }
      });

      if (!items.length)
        return res.status(400).json(errorResponse('No items for this quarter'));

      const grouped = {
        WRITTEN_WORK: [],
        PERFORMANCE_TASK: [],
        QUARTERLY_ASSESSMENT: []
      };

      items.forEach(i => grouped[i.type].push(i));

      const getPS = arr => {
        const totalScore = arr.reduce((s, i) => s + i.score, 0);
        const totalMax = arr.reduce((s, i) => s + i.maxScore, 0);
        return (totalScore / totalMax) * 100;
      };

      const la = grade.learningArea;

      const score = Math.round(
        getPS(grouped.WRITTEN_WORK) * (la.writtenWorkWeight / 100) +
        getPS(grouped.PERFORMANCE_TASK) * (la.performanceTaskWeight / 100) +
        getPS(grouped.QUARTERLY_ASSESSMENT) * (la.quarterlyAssessmentWeight / 100)
      );

      updateData[quarter] = score;
    } else {
      updateData[quarter] = null;
    }

    let updatedGrade = await prisma.sF9Grade.update({
      where: { id: Number(gradeId) },
      data: updateData
    });

    const allReady = ALLOWED_QUARTERS.every(q =>
      updatedGrade[`${q}Ready`] && updatedGrade[q] !== null
    );

    if (allReady) {
      const finalRating = Math.ceil(
        (updatedGrade.q1 + updatedGrade.q2 + updatedGrade.q3 + updatedGrade.q4) / 4
      );

      const remarks = finalRating >= 75 ? 'PASSED' : 'FAILED';

      updatedGrade = await prisma.sF9Grade.update({
        where: { id: Number(gradeId) },
        data: { finalRating, remarks }
      });
    }

    res.json(successResponse('Quarter updated', updatedGrade));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to update quarter', err.message));
  }
});

// -----------------------------
// [POST] Create grade items
// -----------------------------
router.post('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let itemsToCreate = Array.isArray(req.body) ? req.body : [req.body];

    // -----------------------------
    // Validate fields
    // -----------------------------
    for (const item of itemsToCreate) {
      const { sf9GradeId, quarter, type, score, maxScore } = item;

      if (!sf9GradeId || !quarter || !type || score === undefined || maxScore === undefined)
        return res.status(400).json(errorResponse('Missing fields'));

      if (!ALLOWED_ITEM_TYPES.includes(type))
        return res.status(400).json(errorResponse('Invalid type'));

      if (![1, 2, 3, 4].includes(Number(quarter)))
        return res.status(400).json(errorResponse('Quarter must be 1–4'));

      if (isNaN(score) || isNaN(maxScore) || score < 0 || maxScore <= 0 || score > maxScore)
        return res.status(400).json(errorResponse('Invalid score values'));
    }

    const gradeIds = itemsToCreate.map(i => i.sf9GradeId);

    const grades = await prisma.sF9Grade.findMany({
      where: { id: { in: gradeIds } }
    });

    // -----------------------------
    // Validate grade existence + finalized check
    // -----------------------------
    for (const item of itemsToCreate) {
      const grade = grades.find(g => g.id === item.sf9GradeId);
      if (!grade) return res.status(400).json(errorResponse('Grade not found'));

      const quarterFlag = `q${item.quarter}Ready`;

      if (grade[quarterFlag])
        return res.status(400).json(
          errorResponse(`Quarter ${item.quarter} finalized`)
        );
    }

    // -----------------------------
    // 🔥 CRITICAL FIX:
    // Only ONE Quarterly Assessment per quarter
    // -----------------------------
    for (const item of itemsToCreate) {
      if (item.type === 'QUARTERLY_ASSESSMENT') {

        const existingQA = await prisma.sF9GradeItem.findFirst({
          where: {
            sf9GradeId: item.sf9GradeId,
            quarter: Number(item.quarter),
            type: 'QUARTERLY_ASSESSMENT'
          }
        });

        if (existingQA)
          return res.status(400).json(
            errorResponse(
              `Quarter ${item.quarter} already has a Quarterly Assessment`
            )
          );
      }
    }

    // -----------------------------
    // Create items
    // -----------------------------
    const created = await prisma.$transaction(
      itemsToCreate.map(item =>
        prisma.sF9GradeItem.create({
          data: {
            sf9GradeId: item.sf9GradeId,
            quarter: Number(item.quarter),
            type: item.type,
            score: item.score,
            maxScore: item.maxScore
          }
        })
      )
    );

    res.json(successResponse('Items created', created));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to create items', err.message));
  }
});

// -----------------------------
// [PUT] Update grade item
// -----------------------------
router.put('/sf9/item/:itemId', verifyAdviser, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quarter, type, score, maxScore } = req.body;

    const item = await prisma.sF9GradeItem.findUnique({
      where: { id: Number(itemId) },
      include: { grade: true }
    });

    if (!item) return res.status(404).json(errorResponse('Item not found'));

    const currentFlag = `q${item.quarter}Ready`;
    if (item.grade[currentFlag])
      return res.status(400).json(errorResponse('Quarter finalized'));

    if (quarter && quarter !== item.quarter) {
      const newFlag = `q${quarter}Ready`;
      if (item.grade[newFlag])
        return res.status(400).json(errorResponse('Target quarter finalized'));
    }

    const updated = await prisma.sF9GradeItem.update({
      where: { id: Number(itemId) },
      data: {
        quarter: quarter ?? item.quarter,
        type: type ?? item.type,
        score: score ?? item.score,
        maxScore: maxScore ?? item.maxScore
      }
    });

    res.json(successResponse('Item updated', updated));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to update item', err.message));
  }
});

// -----------------------------
// [DELETE] Grade items
// -----------------------------
router.delete('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let { itemIds } = req.body;
    if (!Array.isArray(itemIds)) itemIds = [itemIds];

    const items = await prisma.sF9GradeItem.findMany({
      where: { id: { in: itemIds.map(Number) } },
      include: { grade: true }
    });

    for (const item of items) {
      const flag = `q${item.quarter}Ready`;
      if (item.grade[flag])
        return res.status(400).json(errorResponse('Quarter finalized'));
    }

    await prisma.sF9GradeItem.deleteMany({
      where: { id: { in: itemIds.map(Number) } }
    });

    res.json(successResponse('Items deleted'));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete items', err.message));
  }
});

// -----------------------------
// [DELETE] SF9 grade
// -----------------------------
router.delete('/sf9/:gradeId', verifyAdviser, async (req, res) => {
  try {
    const grade = await prisma.sF9Grade.findUnique({
      where: { id: Number(req.params.gradeId) }
    });

    if (!grade) return res.status(404).json(errorResponse('Grade not found'));

    const anyReady = ALLOWED_QUARTERS.some(q => grade[`${q}Ready`]);
    if (anyReady)
      return res.status(400).json(errorResponse('Cannot delete finalized grade'));

    await prisma.sF9Grade.delete({
      where: { id: Number(req.params.gradeId) }
    });

    res.json(successResponse('Grade deleted'));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete grade', err.message));
  }
});

module.exports = router;