// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
const bcrypt = require('bcrypt');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] Retrieve admin's own profile (protected)
// /api/admin/profile
router.get('/', verifyAdmin, async (req, res) => {
    // [DEBUG] Check if adminId is present from middleware
    console.log('[DEBUG] adminId from token:', req.adminId);

    if (!req.adminId) {
        return res.status(401).json(errorResponse('Unauthorized: adminId missing'));
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { id: req.adminId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!admin) {
            return res.status(404).json(errorResponse('Admin not found'));
        }

        res.json(successResponse('Admin profile retrieved', admin));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch admin profile', err.message));
    }
});

// ?[PUT] Update admin's own profile (protected)
// /api/admin/profile
router.put('/', verifyAdmin, async (req, res) => {
    try {
        const { name, username, email } = req.body;

        if (!name && !username && !email) {
            return res.status(400).json(
                errorResponse('No changes detected. Provide name, username, or email to update.')
            );
        }

        const currentAdmin = await prisma.admin.findUnique({
            where: { id: req.adminId },
            select: { name: true, username: true, email: true },
        });

        if (!currentAdmin) {
            return res.status(404).json(errorResponse('Admin not found'));
        }

        const updateData = {};
        if (name && name !== currentAdmin.name) updateData.name = name;
        if (username && username !== currentAdmin.username) updateData.username = username;
        if (email && email !== currentAdmin.email) updateData.email = email;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(errorResponse('No changes detected. Profile is already up to date.'));
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id: req.adminId },
            data: updateData,
            select: { id: true, name: true, username: true, email: true, createdAt: true, updatedAt: true },
        });

        res.json(successResponse('Admin profile updated successfully', updatedAdmin));
    } catch (err) {
        if (err.code === 'P2002' && err.meta?.target) {
            const conflictField = err.meta.target.join(', ');
            return res.status(409).json(errorResponse(`${conflictField} already in use`));
        }
        res.status(500).json(errorResponse('Failed to update admin profile', err.message));
    }
});

// ?[PUT] Change admin's own password (protected)
// /api/admin/profile/change-password
router.put('/change-password', verifyAdmin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json(errorResponse('Current and new passwords are required'));
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { id: req.adminId },
            select: { password: true },
        });

        if (!admin) {
            return res.status(404).json(errorResponse('Admin not found'));
        }

        const isCurrentMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentMatch) {
            return res.status(401).json(errorResponse('Current password is incorrect'));
        }

        const isSameAsCurrent = await bcrypt.compare(newPassword, admin.password);
        if (isSameAsCurrent) {
            return res.status(400).json(errorResponse('New password cannot be the same as the current password'));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.admin.update({
            where: { id: req.adminId },
            data: { password: hashedPassword },
        });

        res.json(successResponse('Password updated successfully'));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to update password', err.message));
    }
});

module.exports = router;