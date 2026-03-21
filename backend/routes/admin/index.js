// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

router.use('/profile', require('./profile'));
router.use('/dashboard', require('./dashboard'));
router.use('/users', require('./users'));
router.use('/students', require('./students'));
router.use('/advisers', require('./advisers'));
router.use('/sections', require('./sections'));
router.use('/school', require('./school'));
router.use('/learning-area', require('./learningArea'));

// ?[GET] Retrieve list of all admins with total count (protected)
// /api/admin/all
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    // ?[FETCH] Get all admins
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    });

    // *[CALC] Total number of admins
    const totalAdmins = admins.length;

    // *[SUCCESS] Return both list and count
    res.json(successResponse('Admin list retrieved successfully', {
      totalAdmins,
      admins,
    }));
  } catch (err) {
    // ![ERROR] Failed to fetch admin list
    res.status(500).json(errorResponse('Failed to fetch admin list', err.message));
  }
});

module.exports = router;