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
// /api/adviser/grades/sf9/:studentId?type=WRITTEN_WORK
// -----------------------------
router.get('/sf9/:studentId', verifyAdviser, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    if (type && !ALLOWED_ITEM_TYPES.includes(type)) {
      return res.status(400).json(
        errorResponse('Invalid type. Must be WRITTEN_WORK, PERFORMANCE_TASK, or QUARTERLY_ASSESSMENT')
      );
    }

    const grades = await prisma.sF9Grade.findMany({
      where: { studentId: Number(studentId) },
      include: {
        learningArea: true,
        items: {
          ...(type
            ? { where: { type }, select: { id: true, sf9GradeId: true, quarter: true, type: true, score: true, maxScore: true } }
            : { select: { id: true, sf9GradeId: true, quarter: true, type: true, score: true, maxScore: true } })
        }
      },
      orderBy: { learningAreaId: 'asc' }
    });

    if (!grades.length) {
      return res.status(404).json(errorResponse('No SF9 grades found for this student'));
    }

    res.json(successResponse('SF9 grades retrieved', grades));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch SF9 grades', err.message));
  }
});

// [GET] Retrieve all students in a section with their finalRating & remarks
// /api/adviser/grades/section/:sectionId
router.get('/section/:sectionId', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Get all students in the section with their SF9 grades
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          some: { sectionId: Number(sectionId) }
        }
      },
      include: {
        sf9Grades: {
          select: { finalRating: true, remarks: true },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    const responseData = students.map(s => {
      const validGrades = s.sf9Grades.filter(g => g.finalRating !== null);

      const average =
        validGrades.length > 0
          ? Math.round(validGrades.reduce((sum, g) => sum + g.finalRating, 0) / validGrades.length)
          : null;

      // Safely pick the latest remarks
      const remarks =
        validGrades.length > 0
          ? validGrades[validGrades.length - 1].remarks
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
    console.error(err); // log the real error
    res.status(500).json(errorResponse('Failed to fetch section grades', err.message || String(err)));
  }
});

// -----------------------------
// [POST] Create new SF9 grades (single or bulk) with upsert to avoid duplicates
// /api/adviser/grades/sf9
// -----------------------------
router.post('/sf9', verifyAdviser, async (req, res) => {
  try {
    let { grades } = req.body;
    if (!Array.isArray(grades)) grades = [grades];
    if (!grades.length) return res.status(400).json(errorResponse('grades array is required and cannot be empty'));

    const createOps = grades.map(g =>
      prisma.sF9Grade.upsert({
        where: {
          studentId_learningAreaId_schoolYear: {
            studentId: g.studentId,
            learningAreaId: g.learningAreaId,
            schoolYear: g.schoolYear
          }
        },
        update: {
          q1: g.q1 ?? null,
          q2: g.q2 ?? null,
          q3: g.q3 ?? null,
          q4: g.q4 ?? null,
          finalRating: g.finalRating ?? null,
          remarks: g.remarks ?? null
        },
        create: {
          studentId: g.studentId,
          learningAreaId: g.learningAreaId,
          schoolYear: g.schoolYear,
          q1: g.q1 ?? null,
          q2: g.q2 ?? null,
          q3: g.q3 ?? null,
          q4: g.q4 ?? null,
          finalRating: g.finalRating ?? null,
          remarks: g.remarks ?? null
        },
        include: { items: true }
      })
    );

    const newGrades = await prisma.$transaction(createOps);
    res.json(successResponse('SF9 grades created successfully', newGrades));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to create SF9 grades', err.message));
  }
});

// -----------------------------
// [PATCH] Set quarter ready flag for SF9 grade
// /api/adviser/grades/sf9/:gradeId/quarter-ready
// -----------------------------
router.patch('/sf9/:gradeId/quarter-ready', verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { quarter, ready } = req.body;

    if (!ALLOWED_QUARTERS.includes(quarter))
      return res.status(400).json(errorResponse('Invalid quarter. Must be one of q1, q2, q3, q4'));
    if (typeof ready !== 'boolean')
      return res.status(400).json(errorResponse('Invalid ready value. Must be true or false'));

    const fieldName = `${quarter}Ready`;
    let updateData = { [fieldName]: ready };

    if (ready) {
      const items = await prisma.sF9GradeItem.findMany({
        where: { sf9GradeId: Number(gradeId), quarter: parseInt(quarter.slice(1)) }
      });

      const missingTypes = ALLOWED_ITEM_TYPES.filter(type => !items.some(i => i.type === type));
      if (missingTypes.length)
        return res.status(400).json(errorResponse(`Cannot set ${quarter} ready. Missing grade items for: ${missingTypes.join(', ')}`));

      const categoryAverages = {};
      for (const type of ALLOWED_ITEM_TYPES) {
        const typeItems = items.filter(i => i.type === type);
        const sum = typeItems.reduce((acc, i) => acc + (i.score / i.maxScore) * 100, 0);
        categoryAverages[type] = sum / typeItems.length;
      }

      const grade = await prisma.sF9Grade.findUnique({
        where: { id: Number(gradeId) },
        include: { learningArea: true }
      });

      const la = grade.learningArea;
      const quarterScore = Math.round(
        categoryAverages['WRITTEN_WORK'] * la.writtenWorkWeight +
        categoryAverages['PERFORMANCE_TASK'] * la.performanceTaskWeight +
        categoryAverages['QUARTERLY_ASSESSMENT'] * la.quarterlyAssessmentWeight
      );

      updateData[quarter] = quarterScore;
    } else {
      updateData[quarter] = null;
    }

    let updatedGrade = await prisma.sF9Grade.update({
      where: { id: Number(gradeId) },
      data: updateData,
      include: { items: true, learningArea: true }
    });

    // Auto final rating
    const allQuartersReady = ALLOWED_QUARTERS.every(q => updatedGrade[`${q}Ready`] && updatedGrade[q] !== null);
    if (allQuartersReady) {
      const finalRating = Math.ceil(
        (updatedGrade.q1 + updatedGrade.q2 + updatedGrade.q3 + updatedGrade.q4) / 4
      );
      const remarks = finalRating >= 75 ? 'PASSED' : 'FAILED';
      updatedGrade = await prisma.sF9Grade.update({
        where: { id: Number(gradeId) },
        data: { finalRating, remarks },
        include: { items: true, learningArea: true }
      });
    } else if (!ready) {
      updatedGrade = await prisma.sF9Grade.update({
        where: { id: Number(gradeId) },
        data: { finalRating: null, remarks: null },
        include: { items: true, learningArea: true }
      });
    }

    res.json(successResponse(`Quarter ${quarter} ready flag updated`, updatedGrade));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update quarter ready flag', err.message));
  }
});

// -----------------------------
// [POST, PUT, DELETE] SF9 grade items and DELETE grade
// (all your original endpoints remain intact)
// -----------------------------
router.post('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let itemsToCreate = Array.isArray(req.body) ? req.body : [req.body];

    for (const item of itemsToCreate) {
      const { sf9GradeId, quarter, type, score, maxScore } = item;
      if (!sf9GradeId || !quarter || !type || score === undefined || maxScore === undefined)
        return res.status(400).json(errorResponse('Each item must include sf9GradeId, quarter, type, score, and maxScore'));
    }

    const gradeIds = itemsToCreate.map(i => i.sf9GradeId);
    const existingGrades = await prisma.sF9Grade.findMany({ where: { id: { in: gradeIds } }, select: { id: true } });
    const existingIds = existingGrades.map(g => g.id);
    for (const item of itemsToCreate) {
      if (!existingIds.includes(item.sf9GradeId)) {
        return res.status(400).json(errorResponse(`SF9 grade with id ${item.sf9GradeId} does not exist`));
      }
    }

    const createdItems = await prisma.$transaction(
      itemsToCreate.map(item =>
        prisma.sF9GradeItem.create({
          data: { sf9GradeId: item.sf9GradeId, quarter: item.quarter, type: item.type, score: item.score, maxScore: item.maxScore }
        })
      )
    );

    res.json(successResponse('SF9 grade item(s) created successfully', createdItems));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to create SF9 grade item(s)', err.message));
  }
});

router.put('/sf9/item/:itemId', verifyAdviser, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quarter, type, score, maxScore } = req.body;

    const existingItem = await prisma.sF9GradeItem.findUnique({
      where: { id: Number(itemId) },
      include: { grade: true }
    });

    if (!existingItem) return res.status(404).json(errorResponse('Grade item not found'));

    const quarterFlag = `q${existingItem.quarter}Ready`;
    if (existingItem.grade[quarterFlag])
      return res.status(400).json(errorResponse(`Cannot edit grade item. Quarter ${existingItem.quarter} is already marked as ready`));

    const updatedItem = await prisma.sF9GradeItem.update({
      where: { id: Number(itemId) },
      data: { quarter, type, score, maxScore }
    });

    res.json(successResponse('SF9 grade item updated', updatedItem));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update SF9 grade item', err.message));
  }
});

router.delete('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let { itemIds } = req.body;
    if (!itemIds) return res.status(400).json(errorResponse('itemIds is required'));
    if (!Array.isArray(itemIds)) itemIds = [itemIds];
    const numericIds = itemIds.map(id => Number(id)).filter(Boolean);
    if (!numericIds.length) return res.status(400).json(errorResponse('Invalid itemIds provided'));

    const items = await prisma.sF9GradeItem.findMany({
      where: { id: { in: numericIds } },
      include: { grade: true }
    });

    if (!items.length) return res.status(404).json(errorResponse('No grade items found for the given IDs'));

    for (const item of items) {
      const quarterFlag = `q${item.quarter}Ready`;
      if (item.grade?.[quarterFlag])
        return res.status(400).json(errorResponse(`Cannot delete item ID ${item.id}. Quarter ${item.quarter} is already marked as ready`));
    }

    await prisma.sF9GradeItem.deleteMany({ where: { id: { in: numericIds } } });
    res.json(successResponse('SF9 grade item(s) deleted successfully', { deletedIds: numericIds }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete SF9 grade item(s)', err.message));
  }
});

router.delete('/sf9/:gradeId', verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const grade = await prisma.sF9Grade.findUnique({ where: { id: Number(gradeId) } });

    if (!grade) return res.status(404).json(errorResponse('SF9 grade not found'));

    const anyReady = ALLOWED_QUARTERS.some(q => grade[`${q}Ready`]);
    if (anyReady) return res.status(400).json(errorResponse('Cannot delete a grade with ready quarters'));

    await prisma.sF9Grade.delete({ where: { id: Number(gradeId) } });
    res.json(successResponse('SF9 grade deleted'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete SF9 grade', err.message));
  }
});

module.exports = router;