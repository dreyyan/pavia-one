const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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
    const { name, email } = req.body;

    try {
        // ![ERROR] Email already exists
        if (email) {
            const existing = await prisma.student.findUnique({ where: { email } });
            if (existing && existing.id !== req.studentId) {
                return res.status(409).json(errorResponse('Email already in use'));
            }
        }

        const updated = await prisma.student.update({
            where: { id: req.studentId },
            data: { name, email },
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