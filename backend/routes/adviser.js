// routes/adviser.js
const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');   // adjust path if needed

require('dotenv').config();
const jwt = require('jsonwebtoken');

const { successResponse, errorResponse } = require('../utils/response');

// ────────────────────────────────────────────────
// Middleware to verify adviser JWT
const verifyAdviser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json(errorResponse('No token provided'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adviserId = decoded.adviserId; // you will need to change token payload later
        next();
    } catch (err) {
        return res.status(401).json(errorResponse('Invalid or expired token'));
    }
};

// ────────────────────────────────────────────────
// GET /api/adviser/profile
router.get('/profile', verifyAdviser, async (req, res) => {
    try {
        const adviser = await prisma.adviser.findUnique({
            where: { id: req.adviserId },
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        if (!adviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        res.json(successResponse('Adviser profile retrieved', adviser));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch adviser profile', err.message));
    }
});

// ────────────────────────────────────────────────
// GET /api/adviser/students
// List students assigned to this adviser (class adviser view)
// This assumes you will later add: Section, Enrollment, ClassAdviser relation
router.get('/students', verifyAdviser, async (req, res) => {
    try {
        // Placeholder – real implementation needs class/section relation
        res.json(successResponse('Students list (placeholder)', {
            message: 'Implement after adding Section / Enrollment models',
            adviserId: req.adviserId
        }));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch students', err.message));
    }
});

// ────────────────────────────────────────────────
// POST /api/adviser/grade-encoding  (example endpoint)
// This is placeholder structure – real version needs Grade model
router.post('/grade-encoding', verifyAdviser, async (req, res) => {
    const { studentId, subject, quarter, grade } = req.body;

    try {
        // Placeholder response – real logic after Grade model exists
        res.status(201).json(successResponse('Grade recorded (placeholder)', {
            studentId,
            subject,
            quarter,
            grade,
            recordedBy: req.adviserId
        }));
    } catch (err) {
        res.status(400).json(errorResponse('Failed to record grade', err.message));
    }
});

module.exports = router;