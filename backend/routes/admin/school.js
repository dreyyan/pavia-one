const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin; // assuming you have admin auth

// ?[GET] Get School Data
// /api/admin/school
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(404).json(errorResponse('No school found'));
    }
    res.json(successResponse('School retrieved successfully', school));
  } catch (err) {
    console.error('Get school error:', err);
    res.status(500).json(errorResponse('Failed to retrieve school', err.message));
  }
});

// ?[POST] Create School Data
// /api/admin/school
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { schoolIdNumber, schoolName, region, division, district } = req.body;

    // Check if school already exists
    const existing = await prisma.school.findFirst();
    if (existing) {
      return res.status(400).json(errorResponse('A school already exists. You can edit it instead.'));
    }

    const school = await prisma.school.create({
      data: { schoolIdNumber, schoolName, region, division, district }
    });

    res.json(successResponse('School created successfully', school));
  } catch (err) {
    console.error('Create school error:', err);
    res.status(500).json(errorResponse('Failed to create school', err.message));
  }
});

// ?[PUT] Update School Data
// /api/admin/school
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const { schoolIdNumber, schoolName, region, division, district } = req.body;

    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(404).json(errorResponse('No school found to update'));
    }

    const updated = await prisma.school.update({
      where: { id: school.id },
      data: { schoolIdNumber, schoolName, region, division, district }
    });

    res.json(successResponse('School updated successfully', updated));
  } catch (err) {
    console.error('Update school error:', err);
    res.status(500).json(errorResponse('Failed to update school', err.message));
  }
});

// ?[DELETE] Delete School Data
// /api/admin/school
router.delete('/', verifyAdmin, async (req, res) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(404).json(errorResponse('No school found to delete'));
    }

    await prisma.school.delete({ where: { id: school.id } });

    res.json(successResponse('School deleted successfully', null));
  } catch (err) {
    console.error('Delete school error:', err);
    res.status(500).json(errorResponse('Failed to delete school', err.message));
  }
});

module.exports = router;