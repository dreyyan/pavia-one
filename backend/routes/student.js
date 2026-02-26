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
            where: { id: req.studentId },
            select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
                createdAt: true,
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

// ?[PUT] Update own profile (password change should be separate route)
// /api/student/profile
router.put('/profile', verifyStudent, async (req, res) => {
    let { name, email } = req.body;

    try {
        // Fetch current student profile
        const student = await prisma.student.findUnique({
            where: { id: req.studentId },
            select: { id: true, name: true, email: true }
        });

        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        const updates = {};

        // Update name if provided
        if (name && name !== student.name) {
            updates.name = name;
        }

        // Update email if provided
        if (email) {
            email = email.trim().toLowerCase();

            // ![ERROR] New email is the same as current
            if (email === student.email.toLowerCase()) {
                return res.status(400).json(errorResponse('No changes detected for email'));
            }

            // Check if another student already has this email
            const existing = await prisma.student.findUnique({ where: { email } });
            
            // ![ERROR] Email already exists
            if (existing && existing.id !== req.studentId) {
                return res.status(409).json(errorResponse('Email already in use'));
            }

            updates.email = email;
        }

        // If no updates, return early
        if (Object.keys(updates).length === 0) {
            return res.status(400).json(errorResponse('No changes detected'));
        }

        // Update the student profile
        const updated = await prisma.student.update({
            where: { id: req.studentId },
            data: updates,
            select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
            }
        });

        // *[SUCCESS] Return updated profile
        res.json(successResponse('Profile updated successfully', updated));

    } catch (err) {
        // Catch Prisma unique constraint errors
        if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
            return res.status(409).json(errorResponse('Email already in use'));
        }

        res.status(400).json(errorResponse('Failed to update profile', err.message));
    }
});

// ?[GET] View own current / recent grades
router.get('/grades', verifyStudent, async (req, res) => {
    try {
        // TODO: Implement actual grade fetching logic after Grade model is added
        res.json(successResponse('Grades fetched (placeholder)', {
            message: 'Grade viewing endpoint ready – implement after Grade model is added',
            studentId: req.studentId
        }));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch grades', err.message));
    }
});

module.exports = router;