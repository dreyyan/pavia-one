// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyStudent = require('../../middleware/authMiddleware').verifyStudent;

// ?[GET] Get student's current section (with adviser info)
// /api/student/section
router.get('/section', verifyStudent, async (req, res) => {
    try {
        // Find the current enrollment for this student
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                student: { lrn: req.lrn },
                status: 'ENROLLED' // only the active section
            },
            select: {
                section: {
                    select: {
                        id: true,
                        name: true,
                        gradeLevel: true,
                        schoolYear: true,
                        adviser: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!enrollment || !enrollment.section) {
            return res.status(404).json(errorResponse('Section not found'));
        }

        res.json(successResponse('Section retrieved', enrollment.section));
    } catch (err) {
        console.error('Student section fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch section', err.message));
    }
});

// ?[GET] Get student's SF9 grades
// /api/student/grades
router.get('/grades', verifyStudent, async (req, res) => {
    try {
        const grades = await prisma.sf9Grade.findMany({
            where: { student: { lrn: req.lrn } },
            select: {
                learningArea: { select: { name: true } },
                schoolYear: true,
                q1: true,
                q2: true,
                q3: true,
                q4: true,
                finalRating: true,
                remarks: true
            },
            orderBy: { learningAreaId: 'asc' }
        });

        if (!grades || grades.length === 0) {
            return res.status(404).json(errorResponse('No grades found'));
        }

        res.json(successResponse('Grades retrieved', grades));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch grades', err.message));
    }
});

// ?[GET] Get student's SF9 Core Values
// /api/student/core-values
router.get('/core-values', verifyStudent, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },
            select: {
                sf9CoreValues: {
                    select: {
                        coreValue: { select: { name: true } },
                        q1: true,
                        q2: true,
                        q3: true,
                        q4: true
                    }
                }
            }
        });

        if (!student || !student.sf9CoreValues) {
            return res.status(404).json(errorResponse('Core values not found'));
        }

        res.json(successResponse('Core values retrieved', student.sf9CoreValues));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch core values', err.message));
    }
});

// ?[GET] Get student's attendance summary (SF2 Monthly Summary)
// /api/student/attendance
router.get('/attendance', verifyStudent, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },
            select: {
                monthlySummaries: {
                    select: {
                        schoolYear: true,
                        month: true,
                        totalPresent: true,
                        totalAbsent: true,
                        remarks: true
                    },
                    orderBy: { month: 'asc' }
                }
            }
        });

        if (!student || !student.monthlySummaries) {
            return res.status(404).json(errorResponse('Attendance summary not found'));
        }

        res.json(successResponse('Attendance summary retrieved', student.monthlySummaries));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch attendance', err.message));
    }
});

module.exports = router;