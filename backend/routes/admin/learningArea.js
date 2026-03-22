// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] Get All Learning Areas
// /api/admin/learning-area
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const learningAreas = await prisma.learningArea.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(successResponse('Learning areas retrieved successfully', learningAreas));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch learning areas', err.message));
  }
});

// ?[POST] Auto-create all learning areas for all grades and curriculums
// /api/admin/learning-area/auto-create-all
router.post('/auto-create-all', verifyAdmin, async (req, res) => {
  try {
    const gradeLevels = [7, 8, 9, 10];
    const curriculums = ['Regular', 'STE', 'SPS', 'SPA', 'SPJ'];

    const coreSubjects = [
      { name: 'Filipino', ww: 0.3, pt: 0.5, qa: 0.2 },
      { name: 'English', ww: 0.3, pt: 0.5, qa: 0.2 },
      { name: 'Mathematics', ww: 0.4, pt: 0.4, qa: 0.2 },
      { name: 'Science', ww: 0.4, pt: 0.4, qa: 0.2 },
      { name: 'Araling Panlipunan', ww: 0.3, pt: 0.5, qa: 0.2 },
      { name: 'Edukasyon sa Pagpapakatao', ww: 0.3, pt: 0.5, qa: 0.2 },
      { name: 'MAPEH', ww: 0.2, pt: 0.6, qa: 0.2 },
      { name: 'Edukasyong Pantahanan at Pangkabuhayan', ww: 0.2, pt: 0.6, qa: 0.2 },
    ];

    const createdSummary = [];

    for (const gradeLevel of gradeLevels) {
      for (const curriculum of curriculums) {
        let specializedSubjects = [];

        switch (curriculum) {
          case 'STE':
            if (gradeLevel === 7)
              specializedSubjects = [
                { name: 'Environmental Science', ww: 0.4, pt: 0.4, qa: 0.2 },
                { name: 'Research I', ww: 0.3, pt: 0.5, qa: 0.2 },
              ];
            if (gradeLevel === 8)
              specializedSubjects = [
                { name: 'Biotechnology', ww: 0.4, pt: 0.4, qa: 0.2 },
                { name: 'Research II', ww: 0.3, pt: 0.5, qa: 0.2 },
              ];
            if (gradeLevel === 9)
              specializedSubjects = [
                { name: 'Applied Chemistry', ww: 0.4, pt: 0.4, qa: 0.2 },
                { name: 'Research III', ww: 0.3, pt: 0.5, qa: 0.2 },
              ];
            if (gradeLevel === 10)
              specializedSubjects = [
                { name: 'Electronics', ww: 0.4, pt: 0.4, qa: 0.2 },
                { name: 'Research IV', ww: 0.3, pt: 0.5, qa: 0.2 },
              ];
            break;
          case 'SPS':
            specializedSubjects = [{ name: 'Badminton', ww: 0.2, pt: 0.6, qa: 0.2 }];
            break;
          case 'SPA':
            specializedSubjects = [{ name: 'Visual Arts', ww: 0.2, pt: 0.6, qa: 0.2 }];
            break;
          case 'SPJ':
            specializedSubjects = [
              { name: 'ICT', ww: 0.3, pt: 0.5, qa: 0.2 },
              { name: 'Journalism', ww: 0.3, pt: 0.5, qa: 0.2 },
            ];
            break;
          case 'Regular':
          default:
            specializedSubjects = [];
        }

        const allSubjects = [...coreSubjects, ...specializedSubjects];

        const existing = await prisma.learningArea.findMany({
          where: { gradeLevel, curriculum, name: { in: allSubjects.map((s) => s.name) } },
        });
        const existingNames = existing.map((la) => la.name);

        const toCreate = allSubjects.filter((s) => !existingNames.includes(s.name));

        if (toCreate.length === 0) continue;

        const created = await prisma.learningArea.createMany({
          data: toCreate.map((s) => ({
            name: s.name,
            gradeLevel,
            curriculum,
            writtenWorkWeight: s.ww,
            performanceTaskWeight: s.pt,
            quarterlyAssessmentWeight: s.qa,
          })),
          skipDuplicates: true,
        });

        createdSummary.push({
          gradeLevel,
          curriculum,
          createdCount: created.count,
          createdAreas: toCreate.map((s) => s.name),
        });
      }
    }

    if (createdSummary.length === 0) {
      return res.status(400).json(errorResponse('All learning areas already exist for all grades and curriculums'));
    }

    res.json(successResponse('Learning areas auto-created for all grades and curriculums', createdSummary));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to auto-create learning areas', err.message));
  }
});

// ?[POST] Add Learning Area(s)
// /api/admin/learning-area
router.post('/', verifyAdmin, async (req, res) => {
  try {
    let areasToCreate = [];

    if (Array.isArray(req.body)) {
      areasToCreate = req.body;
    } else if (req.body.name) {
      areasToCreate = [{ name: req.body.name, curriculum: req.body.curriculum ?? 'Regular' }];
    } else {
      return res.status(400).json(errorResponse('Name is required to create a learning area'));
    }

    const createdAreas = await prisma.$transaction(
      areasToCreate.map((area) =>
        prisma.learningArea.create({
          data: {
            name: area.name,
            gradeLevel: area.gradeLevel ?? 7,
            curriculum: area.curriculum ?? 'Regular',
            writtenWorkWeight: area.writtenWorkWeight ?? 0.3,
            performanceTaskWeight: area.performanceTaskWeight ?? 0.5,
            quarterlyAssessmentWeight: area.quarterlyAssessmentWeight ?? 0.2,
          },
        })
      )
    );

    res.json(successResponse('Learning area(s) created successfully', createdAreas));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('One or more learning areas already exist'));
    }
    res.status(500).json(errorResponse('Failed to create learning area(s)', err.message));
  }
});

// ?[PUT] Update a learning Area
// /api/admin/learning-area/:id
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, writtenWorkWeight, performanceTaskWeight, quarterlyAssessmentWeight, gradeLevel, curriculum } = req.body;

    if (!name && writtenWorkWeight === undefined && performanceTaskWeight === undefined && quarterlyAssessmentWeight === undefined && gradeLevel === undefined && !curriculum) {
      return res.status(400).json(errorResponse('At least one field is required to update'));
    }

    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) return res.status(404).json(errorResponse('Learning area not found'));

    const updateData = {};
    if (name) updateData.name = name;
    if (writtenWorkWeight !== undefined) updateData.writtenWorkWeight = writtenWorkWeight;
    if (performanceTaskWeight !== undefined) updateData.performanceTaskWeight = performanceTaskWeight;
    if (quarterlyAssessmentWeight !== undefined) updateData.quarterlyAssessmentWeight = quarterlyAssessmentWeight;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (curriculum) updateData.curriculum = curriculum;

    const updated = await prisma.learningArea.update({ where: { id }, data: updateData });

    res.json(successResponse('Learning area updated successfully', updated));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('Learning area with this name and curriculum already exists'));
    }
    res.status(500).json(errorResponse('Failed to update learning area', err.message));
  }
});

// ?[PUT] Bulk Update learning Areas
// /api/admin/learning-area
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const { ids, name, writtenWorkWeight, performanceTaskWeight, quarterlyAssessmentWeight, gradeLevel, curriculum } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || (!name && writtenWorkWeight === undefined && performanceTaskWeight === undefined && quarterlyAssessmentWeight === undefined && gradeLevel === undefined && !curriculum)) {
      return res.status(400).json(errorResponse('ids array is required and at least one field must be provided'));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (writtenWorkWeight !== undefined) updateData.writtenWorkWeight = writtenWorkWeight;
    if (performanceTaskWeight !== undefined) updateData.performanceTaskWeight = performanceTaskWeight;
    if (quarterlyAssessmentWeight !== undefined) updateData.quarterlyAssessmentWeight = quarterlyAssessmentWeight;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (curriculum) updateData.curriculum = curriculum;

    const updated = await prisma.learningArea.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    res.json(successResponse('Learning areas updated successfully', { count: updated.count }));
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json(errorResponse('Duplicate name and curriculum conflict'));
    res.status(500).json(errorResponse('Failed to bulk update learning areas', err.message));
  }
});

// ?[DELETE] Delete all learning areas
// /api/admin/learning-area/all
router.delete('/all', verifyAdmin, async (req, res) => {
  try {
    const total = await prisma.learningArea.count();
    if (total === 0) return res.status(404).json(errorResponse('No learning areas found'));
    const deleted = await prisma.learningArea.deleteMany({});
    res.json(successResponse('All learning areas deleted successfully', { count: deleted.count }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete all learning areas', err.message));
  }
});

// ?[DELETE] Bulk Delete learning Areas
// /api/admin/learning-area
router.delete('/', verifyAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('ids array is required'));
    }

    const deleted = await prisma.learningArea.deleteMany({ where: { id: { in: ids } } });
    res.json(successResponse('Learning areas deleted successfully', { count: deleted.count }));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to bulk delete learning areas', err.message));
  }
});

// ?[DELETE] Delete a Learning Area
// /api/admin/learning-area/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.learningArea.delete({ where: { id } });
    res.json(successResponse('Learning area deleted successfully'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to delete learning area', err.message));
  }
});

module.exports = router;