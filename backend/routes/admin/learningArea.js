// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin; // Make sure you have admin middleware

// ?[GET] Retrieve all learning areas (protected)
// /api/admin/learning-area
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const learningAreas = await prisma.learningArea.findMany({
      orderBy: { name: 'asc' }
    });

    // *[SUCCESS] Return learning areas
    res.json(successResponse('Learning areas retrieved successfully', learningAreas));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch learning areas', err.message));
  }
});

// ?[POST] Auto-create learning areas per grade with specific weights (protected)
// /api/admin/learning-area/auto-create-all
router.post('/auto-create-all', verifyAdmin, async (req, res) => {
  try {
    const { grades } = req.body;

    // ![ERROR] Validate input
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json(errorResponse('grades array is required'));
    }

    let createdSummary = [];

    for (const grade of grades) {
      const { gradeLevel, learningAreas } = grade;

      if (!gradeLevel || !Array.isArray(learningAreas) || learningAreas.length === 0) {
        return res.status(400).json(
          errorResponse('Each grade must have a gradeLevel and a non-empty learningAreas array')
        );
      }

      // Fetch existing learning areas for this grade
      const existing = await prisma.learningArea.findMany({ where: { gradeLevel } });
      const existingNames = existing.map(la => la.name);

      const toCreate = learningAreas.filter(la => !existingNames.includes(la.name));

      if (toCreate.length === 0) continue;

      // Bulk create learning areas for this grade
      const created = await prisma.learningArea.createMany({
        data: toCreate.map(la => ({
          name: la.name,
          description: la.description || null,
          gradeLevel,
          writtenWorkWeight: la.writtenWorkWeight ?? null,
          performanceTaskWeight: la.performanceTaskWeight ?? null,
          quarterlyAssessmentWeight: la.quarterlyAssessmentWeight ?? null
        })),
        skipDuplicates: true
      });

      createdSummary.push({ gradeLevel, createdCount: created.count, createdAreas: toCreate.map(la => la.name) });
    }

    if (createdSummary.length === 0) {
      return res.status(400).json(errorResponse('All specified learning areas already exist'));
    }

    // *[SUCCESS] Return summary
    res.json(successResponse('Learning areas auto-created for grades', createdSummary));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to auto-create learning areas', err.message));
  }
});

// ?[POST] Create one or multiple learning areas (protected)
// /api/admin/learning-area
router.post('/', verifyAdmin, async (req, res) => {
  try {
    let { name, description } = req.body;

    // Normalize input: single object → array
    let areasToCreate = [];
    if (Array.isArray(req.body)) {
      areasToCreate = req.body;
    } else if (name) {
      areasToCreate = [{ name, description: description || null }];
    } else {
      return res.status(400).json(errorResponse('Name is required to create a learning area'));
    }

    // Validate each entry
    for (const area of areasToCreate) {
      if (!area.name) {
        return res.status(400).json(errorResponse('Each learning area must have a name'));
      }
      if (!('description' in area)) area.description = null;
    }

    // Bulk create using Prisma transaction
    const createdAreas = await prisma.$transaction(
      areasToCreate.map(area => 
        prisma.learningArea.create({ data: { name: area.name, description: area.description } })
      )
    );

    // *[SUCCESS] Learning area(s) created
    res.json(successResponse('Learning area(s) created successfully', createdAreas));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('One or more learning areas already exist'));
    }
    res.status(500).json(errorResponse('Failed to create learning area(s)', err.message));
  }
});

// ?[PUT] Update a learning area (single) (protected)
// /api/admin/learning-area/:id
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, writtenWorkWeight, performanceTaskWeight, quarterlyAssessmentWeight } = req.body;

    // ![ERROR] Nothing to update
    if (
      !name &&
      description === undefined &&
      writtenWorkWeight === undefined &&
      performanceTaskWeight === undefined &&
      quarterlyAssessmentWeight === undefined
    ) {
      return res.status(400).json(
        errorResponse('At least one field (name, description, or weights) is required to update')
      );
    }

    // *[CHECK] Does the learning area exist?
    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse('Learning area not found'));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (writtenWorkWeight !== undefined) updateData.writtenWorkWeight = writtenWorkWeight;
    if (performanceTaskWeight !== undefined) updateData.performanceTaskWeight = performanceTaskWeight;
    if (quarterlyAssessmentWeight !== undefined) updateData.quarterlyAssessmentWeight = quarterlyAssessmentWeight;

    const updatedLearningArea = await prisma.learningArea.update({
      where: { id },
      data: updateData
    });

    // *[SUCCESS] Learning area updated
    res.json(successResponse('Learning area updated successfully', updatedLearningArea));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('Learning area with this name already exists'));
    }
    res.status(500).json(errorResponse('Failed to update learning area', err.message));
  }
});

// ?[PUT] Bulk update learning areas (protected)
// /api/admin/learning-area
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const { ids, name, description, writtenWorkWeight, performanceTaskWeight, quarterlyAssessmentWeight } = req.body;

    // ![ERROR] Nothing to update or no IDs provided
    if ((!Array.isArray(ids) || ids.length === 0) || (
      !name &&
      description === undefined &&
      writtenWorkWeight === undefined &&
      performanceTaskWeight === undefined &&
      quarterlyAssessmentWeight === undefined
    )) {
      return res.status(400).json(
        errorResponse('ids array is required and at least one field (name, description, or weights) is required to update')
      );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (writtenWorkWeight !== undefined) updateData.writtenWorkWeight = writtenWorkWeight;
    if (performanceTaskWeight !== undefined) updateData.performanceTaskWeight = performanceTaskWeight;
    if (quarterlyAssessmentWeight !== undefined) updateData.quarterlyAssessmentWeight = quarterlyAssessmentWeight;

    const updated = await prisma.learningArea.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    // *[SUCCESS] Bulk update completed
    res.json(successResponse('Learning areas updated successfully', { count: updated.count }));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('One or more learning areas have duplicate names'));
    }
    res.status(500).json(errorResponse('Failed to bulk update learning areas', err.message));
  }
});

// ?[DELETE] Delete all learning areas (protected)
// /api/admin/learning-area/all
router.delete('/all', verifyAdmin, async (req, res) => {
  try {
    // *[CHECK] Are there any learning areas to delete?
    const total = await prisma.learningArea.count();
    if (total === 0) {
      return res.status(404).json(errorResponse('No learning areas found to delete'));
    }

    const deleted = await prisma.learningArea.deleteMany({});

    // *[SUCCESS] All learning areas deleted
    res.json(successResponse('All learning areas deleted successfully', { count: deleted.count }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete all learning areas', err.message));
  }
});

// ?[DELETE] Bulk delete learning areas (protected)
// /api/admin/learning-area
router.delete('/', verifyAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    // ![ERROR] No IDs provided
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('ids array is required to delete learning areas'));
    }

    const deleted = await prisma.learningArea.deleteMany({
      where: { id: { in: ids } }
    });

    // *[SUCCESS] Bulk delete completed
    res.json(successResponse('Learning areas deleted successfully', { count: deleted.count }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to bulk delete learning areas', err.message));
  }
});

// ?[DELETE] Delete a learning area (single) (protected)
// /api/admin/learning-area/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.learningArea.delete({ where: { id } });

    // *[SUCCESS] Learning area deleted
    res.json(successResponse('Learning area deleted successfully'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete learning area', err.message));
  }
});

module.exports = router;