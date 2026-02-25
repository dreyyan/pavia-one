// routes/student.js
const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');   // adjust path if needed

require('dotenv').config();
const jwt = require('jsonwebtoken');

// Utility functions (assuming same folder structure)
const { successResponse, errorResponse } = require('../utils/response');

// ────────────────────────────────────────────────
// Middleware to verify student JWT (to be used on protected routes)
// You can move this to a separate auth middleware file later
const verifyStudent = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json(errorResponse('No token provided'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.studentId = decoded.studentId;
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

// ────────────────────────────────────────────────
// GET /api/student/profile
// Get current student's own profile (protected)
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
                // Add more fields later (section, grade level, etc.)
            }
        });

        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        res.json(successResponse('Profile retrieved', student));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch profile', err.message));
    }
});

// ────────────────────────────────────────────────
// PUT /api/student/profile
// Update own profile (name, email – password change should be separate route)
router.put('/profile', verifyStudent, async (req, res) => {
    const { name, email } = req.body;

    try {
        // Optional: check if new email is already taken
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

        res.json(successResponse('Profile updated successfully', updated));
    } catch (err) {
        res.status(400).json(errorResponse('Failed to update profile', err.message));
    }
});

// ────────────────────────────────────────────────
// GET /api/student/grades
// View own current / recent grades (expand later with filters: period, subject, etc.)
router.get('/grades', verifyStudent, async (req, res) => {
    try {
        // This assumes you will later add Grade model + relations
        // For now – placeholder response
        // Replace with real query once Grade / Enrollment models exist

        res.json(successResponse('Grades fetched (placeholder)', {
            message: 'Grade viewing endpoint ready – implement after Grade model is added',
            studentId: req.studentId
        }));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch grades', err.message));
    }
});

module.exports = router;