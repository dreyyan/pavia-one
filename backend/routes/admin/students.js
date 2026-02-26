// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[GET] List all students (paginated, searchable, admin-only)
// /api/admin/students
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,           // reasonable default for 5,000+ students
            sortBy = 'studentId',      // name, studentId, createdAt
            sortOrder = 'asc',
            search = '',          // optional search by name / studentId / email
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause for search
        const where = search
            ? {
                OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { studentId: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const [students, total] = await Promise.all([
            prisma.student.findMany({
            where,
            select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
                createdAt: true,
                // Optional: add later when models exist
                // section: { select: { name: true } },
                // gradeLevel: true,
            },
            orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
            skip,
            take,
            }),

            prisma.student.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        // TODO: Consider adding metadata about sections, grade levels, etc. for filtering in frontend
        res.json(
            successResponse('Students retrieved successfully', {
            data: students,
            pagination: {
                total,
                page: parseInt(page),
                limit: take,
                totalPages,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1,
            },
            })
        );
    } catch (err) {
        console.error('Admin students fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch students', err.message));
    }
});

// ?[POST] Add student
// /api/admin/students
router.post('/', verifyAdmin, async (req, res) => {
    const { studentId, name, email, password } = req.body;

    try {
        // Check if email already exists
        const existing = await prisma.student.findFirst({
            where: {
                OR: [
                    { email },
                    { studentId }
                ]
            }
        });

        // ![ERROR] Student with same email or studentId already exists
        if (existing) {
            return res.status(409).json(errorResponse('Student already exists'));
        }

        // Hash password before saving (VERY IMPORTANT)
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await prisma.student.create({
            data: {
                studentId,
                name,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                studentId: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        // *[SUCCESS] Return created student (/wo password)
        res.status(201).json(successResponse('Student created successfully', newStudent));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to create student', err.message));
    }
});

module.exports = router;