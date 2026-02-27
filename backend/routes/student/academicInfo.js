// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyStudent = require('../../middleware/authMiddleware').verifyStudent;

// ?[GET] Get student's section (with adviser info)
// /api/student/section
router.get('/section', verifyStudent, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { lrn: req.lrn },
            select: {
                section: {
                    select: {
                        id: true,
                        name: true,
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

        if (!student || !student.section) {
            return res.status(404).json(errorResponse('Section not found'));
        }

        res.json(successResponse('Section retrieved', student.section));
    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch section', err.message));
    }
});

// // ?[GET] Get student's grades
// // /api/student/grades
// router.get('/grades', verifyStudent, async (req, res) => {
//     try {
//         const grades = await prisma.grade.findMany({
//             where: { studentId: req.lrn },
//             select: {
//                 subject: true,
//                 quarter1: true,
//                 quarter2: true,
//                 quarter3: true,
//                 quarter4: true,
//                 finalRating: true,
//                 remarks: true
//             }
//         });

//         res.json(successResponse('Grades retrieved', grades));
//     } catch (err) {
//         res.status(500).json(errorResponse('Failed to fetch grades', err.message));
//     }
// });

// // ?[GET] Get student's attendance (optional)
// // /api/student/attendance
// router.get('/attendance', verifyStudent, async (req, res) => {
//     try {
//         const attendance = await prisma.attendance.findMany({
//             where: { studentId: req.lrn },
//             select: {
//                 date: true,
//                 status: true // present, absent, late, etc.
//             },
//             orderBy: { date: 'asc' }
//         });

//         res.json(successResponse('Attendance retrieved', attendance));
//     } catch (err) {
//         res.status(500).json(errorResponse('Failed to fetch attendance', err.message));
//     }
// });

module.exports = router;