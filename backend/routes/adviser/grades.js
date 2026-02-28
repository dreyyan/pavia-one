// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] Retrieve all SF9 grades for a student (protected)
// /api/adviser/grades/sf9/:studentId?type=WRITTEN_WORK
router.get('/sf9/:studentId', verifyAdviser, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query;

    // Validate enum if provided
    const allowedTypes = [
      'WRITTEN_WORK',
      'PERFORMANCE_TASK',
      'QUARTERLY_ASSESSMENT'
    ];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json(
        errorResponse('Invalid type. Must be WRITTEN_WORK, PERFORMANCE_TASK, or QUARTERLY_ASSESSMENT')
      );
    }

    const grades = await prisma.sF9Grade.findMany({
    where: { studentId: Number(studentId) },
    include: {
        learningArea: true,
        items: type
        ? {
            where: { type },
            select: { id: true, sf9GradeId: true, quarter: true, type: true, score: true, maxScore: true }
            }
        : {
            select: { id: true, sf9GradeId: true, quarter: true, type: true, score: true, maxScore: true }
            }
    },
    orderBy: { learningAreaId: 'asc' }
    });

    if (!grades.length) {
      return res.status(404).json(
        errorResponse('No SF9 grades found for this student')
      );
    }

    res.json(successResponse('SF9 grades retrieved', grades));
  } catch (err) {
    res.status(500).json(
      errorResponse('Failed to fetch SF9 grades', err.message)
    );
  }
});

// ?[POST] Create new SF9 grades (single or bulk) (protected)
// /api/adviser/grades/sf9
router.post('/sf9', verifyAdviser, async (req, res) => {
  try {
    let { grades } = req.body;

    // Convert single grade object to array
    if (!Array.isArray(grades)) {
      grades = [grades];
    }

    if (!grades.length) {
      return res.status(400).json(
        errorResponse('grades array is required and cannot be empty')
      );
    }

    // Validate each grade
    for (const g of grades) {
      if (!g.studentId || !g.learningAreaId || !g.schoolYear) {
        return res.status(400).json(
          errorResponse('Each grade must have studentId, learningAreaId, and schoolYear')
        );
      }
    }

    const createOps = grades.map(g =>
      prisma.SF9Grade.create({
        data: {
          studentId: g.studentId,
          learningAreaId: g.learningAreaId,
          schoolYear: g.schoolYear,
          q1: g.q1 || null,
          q2: g.q2 || null,
          q3: g.q3 || null,
          q4: g.q4 || null,
          finalRating: g.finalRating || null,
          remarks: g.remarks || null
        },
        include: { items: true }
      })
    );

    const newGrades = await prisma.$transaction(createOps);

    res.json(successResponse('SF9 grades created successfully', newGrades));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(
        errorResponse('One or more grades already exist for the student, subject, and school year')
      );
    }
    res.status(500).json(errorResponse('Failed to create SF9 grades', err.message));
  }
});

// ?[PATCH] Set quarter ready flag for SF9 grade (protected)
// /api/adviser/grades/sf9/:gradeId/quarter-ready
router.patch('/sf9/:gradeId/quarter-ready', verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { quarter, ready } = req.body;

    // Validate quarter
    const allowedQuarters = ['q1', 'q2', 'q3', 'q4'];
    if (!allowedQuarters.includes(quarter)) {
      return res.status(400).json(
        errorResponse('Invalid quarter. Must be one of q1, q2, q3, q4')
      );
    }

    // Validate ready
    if (typeof ready !== 'boolean') {
      return res.status(400).json(
        errorResponse('Invalid ready value. Must be true or false')
      );
    }

    const fieldName = `${quarter}Ready`;
    let updateData = { [fieldName]: ready };

    if (ready) {
      // Fetch all items for this quarter
      const items = await prisma.sF9GradeItem.findMany({
        where: { sf9GradeId: Number(gradeId), quarter: parseInt(quarter.slice(1)) }
      });

      const requiredTypes = ['WRITTEN_WORK', 'PERFORMANCE_TASK', 'QUARTERLY_ASSESSMENT'];

      // Check if each category has at least one item
      const missingTypes = requiredTypes.filter(
        type => !items.some(item => item.type === type)
      );

      if (missingTypes.length) {
        return res.status(400).json(
          errorResponse(
            `Cannot set ${quarter} ready. Missing grade items for: ${missingTypes.join(', ')}`
          )
        );
      }

      // Calculate average for each category
      const categoryAverages = {};
      for (const type of requiredTypes) {
        const typeItems = items.filter(item => item.type === type);
        const sum = typeItems.reduce((acc, i) => acc + (i.score / i.maxScore) * 100, 0);
        categoryAverages[type] = sum / typeItems.length;
      }

      // Fetch learning area to get weights
      const grade = await prisma.sF9Grade.findUnique({
        where: { id: Number(gradeId) },
        include: { learningArea: true }
      });

      const la = grade.learningArea;

      // Compute quarter score based on weights
      const quarterScore = Math.round(
        categoryAverages['WRITTEN_WORK'] * la.writtenWorkWeight +
        categoryAverages['PERFORMANCE_TASK'] * la.performanceTaskWeight +
        categoryAverages['QUARTERLY_ASSESSMENT'] * la.quarterlyAssessmentWeight
      );

      updateData[quarter] = quarterScore;
    } else {
      // If ready is false, reset the quarter score to null
      updateData[quarter] = null;
    }

    // Update SF9 grade
    let updatedGrade = await prisma.sF9Grade.update({
      where: { id: Number(gradeId) },
      data: updateData,
      include: { items: true, learningArea: true }
    });

    // Auto-calculate finalRating if all 4 quarters are ready and not null
    const allQuarters = ['q1', 'q2', 'q3', 'q4'];
    const allQuartersReady = allQuarters.every(q => updatedGrade[`${q}Ready`] && updatedGrade[q] !== null);

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
      // If any quarter is set to not ready, reset finalRating and remarks
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

// ?[POST] Add one or multiple SF9 grade items (protected)
// /api/adviser/grades/sf9/item
router.post('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let itemsToCreate = [];

    // Normalize input: single object → array
    if (Array.isArray(req.body)) {
      itemsToCreate = req.body;
    } else {
      itemsToCreate = [req.body];
    }

    // Validate required fields
    for (const item of itemsToCreate) {
      const { sf9GradeId, quarter, type, score, maxScore } = item;
      if (!sf9GradeId || !quarter || !type || score === undefined || maxScore === undefined) {
        return res.status(400).json(
          errorResponse('Each item must include sf9GradeId, quarter, type, score, and maxScore')
        );
      }
    }

    // Validate that all sf9GradeIds exist
    const gradeIds = itemsToCreate.map(i => i.sf9GradeId);
    const existingGrades = await prisma.sF9Grade.findMany({
      where: { id: { in: gradeIds } },
      select: { id: true }
    });

    const existingIds = existingGrades.map(g => g.id);

    for (const item of itemsToCreate) {
      if (!existingIds.includes(item.sf9GradeId)) {
        return res.status(400).json(
          errorResponse(`SF9 grade with id ${item.sf9GradeId} does not exist`)
        );
      }
    }

    // Bulk create using Prisma transaction
    const createdItems = await prisma.$transaction(
      itemsToCreate.map(item =>
        prisma.sF9GradeItem.create({
          data: {
            sf9GradeId: item.sf9GradeId,
            quarter: item.quarter,
            type: item.type,
            score: item.score,
            maxScore: item.maxScore
          }
        })
      )
    );

    // *[SUCCESS] SF9 grade item(s) created
    res.json(successResponse('SF9 grade item(s) created successfully', createdItems));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to create SF9 grade item(s)', err.message));
  }
});

// ?[PUT] Update SF9 grade item (protected)
// /api/adviser/grades/sf9/item/:itemId
router.put('/sf9/item/:itemId', verifyAdviser, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quarter, type, score, maxScore } = req.body;

    // Fetch the existing item and its parent grade
    const existingItem = await prisma.sF9GradeItem.findUnique({
      where: { id: Number(itemId) },
      include: { grade: true } // Assuming relation `grade` exists in Prisma
    });

    if (!existingItem) {
      return res.status(404).json(errorResponse('Grade item not found'));
    }

    const quarterFlag = `q${existingItem.quarter}Ready`;
    if (existingItem.grade[quarterFlag]) {
      return res.status(400).json(
        errorResponse(`Cannot edit grade item. Quarter ${existingItem.quarter} is already marked as ready`)
      );
    }

    const updatedItem = await prisma.sF9GradeItem.update({
      where: { id: Number(itemId) },
      data: { quarter, type, score, maxScore }
    });

    res.json(successResponse('SF9 grade item updated', updatedItem));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update SF9 grade item', err.message));
  }
});

// ?[DELETE] Delete SF9 grade item(s) (protected)
// /api/adviser/grades/sf9/item
router.delete('/sf9/item', verifyAdviser, async (req, res) => {
  try {
    let { itemIds } = req.body; // Accept either a single ID or array

    // ![ERROR] Missing itemIds
    if (!itemIds) {
      return res.status(400).json(errorResponse('itemIds is required'));
    }

    // Normalize to array
    if (!Array.isArray(itemIds)) {
      itemIds = [itemIds];
    }

    // Convert all IDs to numbers
    const numericIds = itemIds.map(id => Number(id)).filter(Boolean);
    if (!numericIds.length) {
      return res.status(400).json(errorResponse('Invalid itemIds provided'));
    }

    // Fetch all items with their parent grade
    const items = await prisma.sF9GradeItem.findMany({
      where: { id: { in: numericIds } },
      include: { grade: true } // Ensure `grade` relation exists in Prisma schema
    });

    if (!items.length) {
      return res.status(404).json(errorResponse('No grade items found for the given IDs'));
    }

    // Check if any item belongs to a quarter that is already ready
    for (const item of items) {
      const quarterFlag = `q${item.quarter}Ready`;
      if (item.grade?.[quarterFlag]) {
        return res.status(400).json(
          errorResponse(`Cannot delete item ID ${item.id}. Quarter ${item.quarter} is already marked as ready`)
        );
      }
    }

    // Delete all items safely
    await prisma.sF9GradeItem.deleteMany({
      where: { id: { in: numericIds } }
    });

    // *[SUCCESS] Return deleted IDs
    res.json(successResponse('SF9 grade item(s) deleted successfully', { deletedIds: numericIds }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete SF9 grade item(s)', err.message));
  }
});

// ?[DELETE] Delete SF9 grade (protected)
// /api/adviser/grades/sf9/:gradeId
router.delete('/sf9/:gradeId', verifyAdviser, async (req, res) => {
  try {
    const { gradeId } = req.params;

    await prisma.sF9Grade.delete({ where: { id: Number(gradeId) } });

    res.json(successResponse('SF9 grade deleted'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete SF9 grade', err.message));
  }
});

module.exports = router;