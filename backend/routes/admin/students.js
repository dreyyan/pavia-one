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
            limit = 50,
            sortBy = 'lrn',   // name, lrn, createdAt
            sortOrder = 'asc',
            search = '',            // optional search by name / lrn / email
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause for search
        const where = search
            ? {
                OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { lrn: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const [students, total] = await Promise.all([
            prisma.student.findMany({
            where,
            select: {
                id: true,
                lrn: true,
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
    const { lrn, name, email, password, sectionId } = req.body;

    try {
        // Check if email already exists
        const existing = await prisma.student.findFirst({
            where: {
                OR: [
                    { email },
                    { lrn }
                ]
            }
        });

        // ![ERROR] Student with same email or LRN already exists
        if (existing) {
            return res.status(409).json(errorResponse('Student already exists'));
        }

        // Hash password before saving (VERY IMPORTANT)
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStudent = await prisma.student.create({
            data: {
                lrn,
                name,
                email,
                password: hashedPassword,
                section: {
                    connect: { id: sectionId }
                }
            },
            select: {
                id: true,
                lrn: true,
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

// ?[DELETE] Delete a student (admin-only)
// /api/admin/students/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            select: { id: true, lrn: true, name: true, email: true }
        });

        // ![ERROR] Student not found
        if (!student) {
            return res.status(404).json(errorResponse('Student not found'));
        }

        // Delete the student
        await prisma.student.delete({
            where: { id: parseInt(id) }
        });

        // *[SUCCESS] Student deletion
        res.json(successResponse('Student deleted successfully', {
            id: student.id,
            lrn: student.lrn,
            name: student.name,
            email: student.email
        }));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to delete student', err.message));
    }
});

module.exports = router;