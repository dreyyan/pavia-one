// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] Retrieve adviser's own profile
// /api/adviser/profile
router.get('/profile', verifyAdviser, async (req, res) => {
    try {
        const adviser = await prisma.adviser.findUnique({
            where: { adviserId: req.adviserId },
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                mustChangePassword: true,
                sections: true,
                createdAt: true,
            }
        });

        // ![ERROR] Adviser not found
        if (!adviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        // *[SUCCESS] Return adviser profile
        res.json(successResponse('Adviser profile retrieved', adviser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch adviser profile', err.message));
    }
});

// ?[PUT] Update adviser's own profile
// /api/adviser/profile
router.put('/profile', verifyAdviser, async (req, res) => {
    try {
        const { name, email } = req.body;

        // ![ERROR] Nothing to update
        if (!name && !email) {
            return res.status(400).json(
                errorResponse('At least one field (name or email) is required to update')
            );
        }

        // Fetch current adviser data
        const currentAdviser = await prisma.adviser.findUnique({
            where: { adviserId: String(req.adviserId) },
            select: {
                name: true,
                email: true,
            },
        });

        if (!currentAdviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        // Build update data only if values are actually different
        const updateData = {};

        if (name && name !== currentAdviser.name) updateData.name = name;
        if (email && email !== currentAdviser.email) updateData.email = email;

        // If nothing changed, return a message instead of updating
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(
                errorResponse('No changes detected. Profile is already up to date.')
            );
        }

        const updatedAdviser = await prisma.adviser.update({
            where: { adviserId: String(req.adviserId) },
            data: updateData,
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // *[SUCCESS] Return updated profile
        res.json(successResponse('Adviser profile updated successfully', updatedAdviser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to update adviser profile', err.message));
    }
});

// ?[PUT] Change own password
// /api/adviser/change-password
router.put('/change-password', verifyAdviser, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // ![ERROR] Missing fields
    if (!currentPassword || !newPassword) {
        return res.status(400).json(errorResponse('Current and new passwords are required'));
    }

    try {
        const adviser = await prisma.adviser.findUnique({
            where: { adviserId: req.adviserId },
            select: { password: true }
        });

        // ![ERROR] Adviser not found
        if (!adviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        const bcrypt = require('bcrypt');

        // Verify current password
        const isCurrentMatch = await bcrypt.compare(currentPassword, adviser.password);
        if (!isCurrentMatch) {
            return res.status(401).json(errorResponse('Current password is incorrect'));
        }

        // Prevent updating to the same password
        const isSameAsCurrent = await bcrypt.compare(newPassword, adviser.password);
        if (isSameAsCurrent) {
            return res.status(400).json(errorResponse('New password cannot be the same as the current password'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and reset mustChangePassword flag
        await prisma.adviser.update({
            where: { adviserId: req.adviserId },
            data: { password: hashedPassword, mustChangePassword: false }
        });

        // *[SUCCESS] Password updated
        res.json(successResponse('Password updated successfully'));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to update password', err.message));
    }
});

module.exports = router;