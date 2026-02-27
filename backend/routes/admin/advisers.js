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

// ?[GET] List all advisers (paginated, searchable, admin-only)
// /api/admin/advisers
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'adviserId',       // name, adviserId, createdAt
            sortOrder = 'asc',
            search = '',                // optional search by name / adviserId / email
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause for search
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { adviserId: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};

        const [advisers, total] = await Promise.all([
            prisma.adviser.findMany({
                where,
                select: {
                    id: true,
                    adviserId: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    sections: {
                        select: {
                            id: true,
                            name: true,
                            gradeLevel: true,
                            _count: {
                                select: { students: true }, // class size
                            },
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
                skip,
                take,
            }),

            prisma.adviser.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        res.json(
            successResponse('Advisers retrieved successfully', {
                data: advisers,
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
        console.error('Admin advisers fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch advisers', err.message));
    }
});

// ?[POST] Add adviser
// /api/admin/advisers
router.post('/', verifyAdmin, async (req, res) => {
    const { adviserId, name, email, password } = req.body;

    try {
        // Check if email or adviserId already exists
        const existing = await prisma.adviser.findFirst({
            where: {
                OR: [
                    { email },
                    { adviserId }
                ]
            }
        });

        // ![ERROR] Adviser already exists
        if (existing) {
            return res.status(409).json(errorResponse('Adviser already exists'));
        }

        // Hash password before saving
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdviser = await prisma.adviser.create({
            data: {
                adviserId,
                name,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        // *[SUCCESS] Return created adviser (/wo password)
        res.status(201).json(successResponse('Adviser created successfully', newAdviser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to create adviser', err.message));
    }
});

// ?[DELETE] Delete an adviser (admin-only)
// /api/admin/advisers/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if adviser exists
        const adviser = await prisma.adviser.findUnique({
            where: { id: parseInt(id) },
            select: { id: true, adviserId: true, name: true, email: true }
        });

        // ![ERROR] Adviser not found
        if (!adviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        // Delete the adviser
        await prisma.adviser.delete({
            where: { id: parseInt(id) }
        });

        // *[SUCCESS] Adviser deleted successfully
        res.json(successResponse('Adviser deleted successfully', {
            id: adviser.id,
            adviserId: adviser.adviserId,
            name: adviser.name,
            email: adviser.email
        }));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to delete adviser', err.message));
    }
});

module.exports = router;