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

// ?[GET] List all sections
// /api/admin/sections
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
            sortBy = 'name', // name, createdAt
            sortOrder = 'asc',
            search = '',
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = search
            ? {
                name: { contains: search, mode: 'insensitive' },
            }
            : {};

        const [sections, total] = await Promise.all([
            prisma.section.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    adviser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: { students: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
                skip,
                take,
            }),
            prisma.section.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        // *[SUCCESS] Return list of sections
        res.json(
            successResponse('Sections retrieved successfully', {
                data: sections,
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
        console.error('Admin sections fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch sections', err.message));
    }
});

// ?[POST] Create section
// /api/admin/sections
router.post('/', verifyAdmin, async (req, res) => {
    const { name, adviserId, gradeLevel } = req.body; // <-- added gradeLevel

    try {
        // ![ERROR] Missing required fields
        if (!name || !adviserId || gradeLevel === undefined) {
            return res.status(400).json(
                errorResponse('Section name, adviserId, and gradeLevel are required')
            );
        }

        // Check if section name already exists for the same grade level
        const existing = await prisma.section.findFirst({
            where: {
                name,
                gradeLevel,
            },
        });

        // ![ERROR] Existing section name
        if (existing) {
            return res.status(409).json(
                errorResponse(`Section "${name}" already exists for grade level ${gradeLevel}`)
            );
        }

        // Check if adviser exists
        const adviser = await prisma.adviser.findUnique({
            where: { adviserId }, // adviserId is a string like "2026-0001"
        });

        // ![ERROR] Missing adviser
        if (!adviser) {
            return res.status(404).json(
                errorResponse('Adviser not found')
            );
        }

        // Create new section
        const newSection = await prisma.section.create({
            data: {
                name,
                gradeLevel,
                adviser: {
                    connect: { adviserId },
                },
            },
            select: {
                id: true,
                name: true,
                gradeLevel: true,
                createdAt: true,
                adviser: {
                    select: {
                        id: true,
                        adviserId: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // *[SUCCESS] Section creation
        res.status(201).json(
            successResponse('Section created successfully', newSection)
        );

    } catch (err) {
        res.status(500).json(
            errorResponse('Failed to create section', err.message)
        );
    }
});

// ?[DELETE] Delete section
// /api/admin/sections/:id
router.delete('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const section = await prisma.section.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                _count: { select: { students: true } },
            },
        });

        if (!section) {
            return res.status(404).json(
                errorResponse('Section not found')
            );
        }

        // ![ERROR] Section /w existing students
        if (section._count.students > 0) {
            return res.status(400).json(
                errorResponse('Cannot delete section with existing students')
            );
        }

        await prisma.section.delete({
            where: { id: parseInt(id) },
        });

        // *[SUCCESS] Section deletion
        res.json(
            successResponse('Section deleted successfully', {
                id: section.id,
                name: section.name,
            })
        );
    } catch (err) {
        res.status(500).json(
            errorResponse('Failed to delete section', err.message)
        );
    }
});

module.exports = router;