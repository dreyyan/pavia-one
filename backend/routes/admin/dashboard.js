// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] Dashboard summary (protected)
// /api/admin/dashboard/summary
router.get('/summary', verifyAdmin, async (req, res) => {
    // [DEBUG] Check if adminId is present from middleware
    console.log('[DEBUG] adminId from token:', req.adminId);

    if (!req.adminId) {
        return res.status(401).json(errorResponse('Unauthorized: adminId missing'));
    }

    try {
        // ?[FETCH] Admin profile
        const adminProfile = await prisma.admin.findUnique({
            where: { id: req.adminId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!adminProfile) {
            return res.status(404).json(errorResponse('Admin not found'));
        }

        // ?[FETCH] Counts
        const [totalStudents, totalSections, totalAdvisers, totalAdmins] = await Promise.all([
            prisma.student.count(),
            prisma.section.count(),
            prisma.adviser.count(),
            prisma.admin.count()
        ]);

        // *[SUCCESS] Return profile + counts
        res.json(successResponse('Dashboard summary retrieved successfully', {
            adminProfile,
            totalStudents,
            totalSections,
            totalAdvisers,
            totalAdmins
        }));

    } catch (err) {
        // ![ERROR] Failed to fetch dashboard summary
        console.error('Dashboard summary error:', err);
        res.status(500).json(errorResponse('Failed to fetch dashboard summary', err.message));
    }
});

module.exports = router;