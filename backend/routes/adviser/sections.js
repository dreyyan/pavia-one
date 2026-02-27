// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] List students assigned to this adviser's sections
// /api/adviser/sections/students
router.get('/students', verifyAdviser, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', sortBy = 'lrn', sortOrder = 'asc' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Get all section IDs managed by this adviser
        const sections = await prisma.section.findMany({
            where: { adviserId: req.adviserId },
            select: { id: true },
        });
        const sectionIds = sections.map(s => s.id);

        // Build search filter
        const where = {
            sectionId: { in: sectionIds },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { lrn: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        // Fetch students with pagination and include section info
        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                select: {
                    id: true,
                    lrn: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    section: { select: { id: true, name: true, gradeLevel: true } },
                },
                orderBy: { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' },
                skip,
                take,
            }),
            prisma.student.count({ where }),
        ]);

        const totalPages = Math.ceil(total / take);

        // *[SUCCESS] Return student list
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
        console.error('Adviser students fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch students', err.message));
    }
});

// ?[GET] Get a specific section and its students
// /api/adviser/sections/:sectionId
router.get('/:sectionId', verifyAdviser, async (req, res) => {
    const { sectionId } = req.params;
    try {
        // Check if the adviser manages this section
        const section = await prisma.section.findFirst({
            where: {
                id: parseInt(sectionId),
                adviserId: req.adviserId
            },
            select: {
                id: true,
                name: true,
                gradeLevel: true,
                createdAt: true,
                students: {
                    select: {
                        id: true,
                        lrn: true,
                        name: true,
                        email: true,
                        createdAt: true,
                    }
                }
            }
        });

        if (!section) {
            return res.status(404).json(errorResponse('Section not found or not managed by you'));
        }

        // *[SUCCESS] Return section with students
        res.json(successResponse('Section retrieved successfully', section));

    } catch (err) {
        console.error('Adviser section fetch error:', err);
        res.status(500).json(errorResponse('Failed to fetch section', err.message));
    }
});

module.exports = router;