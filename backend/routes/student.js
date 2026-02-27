// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../utils/response');
const verifyStudent = require('../middleware/authMiddleware').verifyStudent;

// ?[GET] Retrieve student's own profile (protected)
// /api/student/profile
router.get('/profile', verifyStudent, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },  // use LRN instead of internal ID
            select: {
                id: true,
                lrn: true,
                name: true,
                email: true,
                sectionId: true,
                createdByAdviserId: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // ![ERROR] Student not found
        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        // *[SUCCESS] Return student profile
        res.json(successResponse('Profile retrieved', student));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch profile', err.message));
    }
});

// ?[PUT] Update own profile
// /api/student/profile
router.put('/profile', verifyStudent, async (req, res) => {
    const { name, email } = req.body;

    try {
        // Fetch current student profile
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },
            select: { id: true, name: true, email: true }
        });

        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        const updates = {};

        // Update name if provided and different
        if (name && name !== student.name) updates.name = name;

        // Update email if provided and different
        if (email) {
            const normalizedEmail = email.trim().toLowerCase();

            if (normalizedEmail !== student.email.toLowerCase()) {
                // Check if another student already has this email
                const existing = await prisma.student.findUnique({ where: { email: normalizedEmail } });
                if (existing && existing.id !== student.id) {
                    return res.status(409).json(errorResponse('Email already in use'));
                }

                updates.email = normalizedEmail;
            }
        }

        // ![ERROR] Nothing to update
        if (Object.keys(updates).length === 0) {
            return res.status(400).json(errorResponse('No changes detected'));
        }

        // Update student profile
        const updated = await prisma.student.update({
            where: { lrn: req.lrn },
            data: updates,
            select: {
                id: true,
                lrn: true,
                name: true,
                email: true,
                updatedAt: true
            }
        });

        // *[SUCCESS] Return updated profile
        res.json(successResponse('Profile updated successfully', updated));

    } catch (err) {
        // Prisma unique constraint handling
        if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
            return res.status(409).json(errorResponse('Email already in use'));
        }

        res.status(500).json(errorResponse('Failed to update profile', err.message));
    }
});

// ?[PUT] Change own password
// /api/student/change-password
router.put('/change-password', verifyStudent, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // ![ERROR] Missing fields
    if (!currentPassword || !newPassword) {
        return res.status(400).json(errorResponse('Current and new passwords are required'));
    }

    try {
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },
            select: { password: true }
        });

        // ![ERROR] Student not found
        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        const bcrypt = require('bcrypt');

        // Verify current password
        const isCurrentMatch = await bcrypt.compare(currentPassword, student.password);
        if (!isCurrentMatch) {
            return res.status(401).json(errorResponse('Current password is incorrect'));
        }

        // Prevent updating to the same password
        const isSameAsCurrent = await bcrypt.compare(newPassword, student.password);
        if (isSameAsCurrent) {
            return res.status(400).json(errorResponse('New password cannot be the same as the current password'));
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and reset mustChangePassword flag
        await prisma.student.update({
            where: { lrn: req.lrn },
            data: { password: hashedPassword, mustChangePassword: false }
        });

        // *[SUCCESS] Password updated
        res.json(successResponse('Password updated successfully'));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to update password', err.message));
    }
});

// ?[GET] View own current / recent grades (placeholder)
// /api/student/grades
router.get('/grades', verifyStudent, async (req, res) => {
    try {
        // TODO: Implement actual grade fetching logic after Grade model is added
        res.json(successResponse('Grades fetched (placeholder)', {
            message: 'Grade viewing endpoint ready – implement after Grade model is added',
            lrn: req.lrn
        }));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch grades', err.message));
    }
});

module.exports = router;