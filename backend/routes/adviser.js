// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../utils/response');
const verifyAdviser = require('../middleware/authMiddleware').verifyAdviser;

// ?[GET] Retrieve adviser's own profile (protected)
// /api/adviser/profile
router.get('/profile', verifyAdviser, async (req, res) => {
    try {
        const adviser = await prisma.adviser.findUnique({
            where: { adviserId: req.adviserId },
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        // ![ERROR] Adviser not found
        if (!adviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        // *[SUCCESS] Return adviser profile
        res.json(successResponse('Adviser profile retrieved', adviser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to fetch adviser profile', err.message));
    }
});

// ?[PUT] Update adviser's own profile (protected)
// /api/adviser/profile
router.put('/profile', verifyAdviser, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // ![ERROR] Nothing to update
        if (!name && !email && !password) {
            return res.status(400).json(
                errorResponse('At least one field (name, email, password) is required to update')
            );
        }

        // Fetch current adviser data
        const currentAdviser = await prisma.adviser.findUnique({
            where: { adviserId: String(req.adviserId) },
            select: {
                name: true,
                email: true,
                password: true,
            },
        });

        if (!currentAdviser) {
            return res.status(404).json(errorResponse('Adviser not found'));
        }

        // Build update data only if values are actually different
        const updateData = {};

        if (name && name !== currentAdviser.name) updateData.name = name;
        if (email && email !== currentAdviser.email) updateData.email = email;
        if (password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Compare hashed password with existing hash
            const isSamePassword = await bcrypt.compare(password, currentAdviser.password);
            if (!isSamePassword) updateData.password = hashedPassword;
        }

        // If nothing changed, return a message instead of updating
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(
                errorResponse('No changes detected. Profile is already up to date.')
            );
        }

        const updatedAdviser = await prisma.adviser.update({
            where: { adviserId: String(req.adviserId) },
            data: updateData,
            select: {
                id: true,
                adviserId: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });

        // *[SUCCESS] Return updated profile
        res.json(successResponse('Adviser profile updated successfully', updatedAdviser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to update adviser profile', err.message));
    }
});

// ?[GET] List students assigned to this adviser's sections
// /api/adviser/students
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

module.exports = router;