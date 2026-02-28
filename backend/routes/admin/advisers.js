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
      sortBy = 'adviserId',
      sortOrder = 'asc',
      search = '',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

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
          mustChangePassword: true,
          createdAt: true,
          sections: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              schoolYear: true,
              curriculum: true,
              _count: {
                select: { enrollments: true }, // class size
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

    // Format sections to include classSize
    const formattedAdvisers = advisers.map((adviser) => ({
      ...adviser,
      sections: adviser.sections.map((section) => ({
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        schoolYear: section.schoolYear,
        curriculum: section.curriculum,
        classSize: section._count.enrollments,
      })),
    }));

    const totalPages = Math.ceil(total / take);

    res.json(
      successResponse('Advisers retrieved successfully', {
        data: formattedAdvisers,
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

// ?[POST] Add adviser (single or bulk)
// /api/admin/advisers
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const bcrypt = require('bcrypt');

    // Detect if body is array (bulk) or object (single)
    const advisersInput = Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (advisersInput.length === 0) {
      return res.status(400).json(
        errorResponse('Request body cannot be empty')
      );
    }

    const createdAdvisers = [];
    const errors = [];

    for (const adviser of advisersInput) {
      const { adviserId, name, email, password } = adviser;

      // Validate required fields
      if (!adviserId || !name || !email || !password) {
        errors.push({
          adviserId,
          message: 'Missing required fields',
        });
        continue;
      }

      // Check duplicates
      const existing = await prisma.adviser.findFirst({
        where: {
          OR: [
            { email },
            { adviserId }
          ],
        },
      });

      if (existing) {
        errors.push({
          adviserId,
          message: 'Adviser already exists',
        });
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdviser = await prisma.adviser.create({
        data: {
          adviserId,
          name,
          email,
          password: hashedPassword,
          mustChangePassword: true,
        },
        select: {
          id: true,
          adviserId: true,
          name: true,
          email: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });

      createdAdvisers.push(newAdviser);
    }

    return res.status(201).json(
      successResponse('Adviser(s) processed successfully', {
        created: createdAdvisers,
        failed: errors,
      })
    );

  } catch (err) {
    console.error('Create adviser error:', err);
    res.status(500).json(
      errorResponse('Failed to create adviser(s)', err.message)
    );
  }
});

// DELETE all advisers
// /api/admin/advisers/all
router.delete('/all', verifyAdmin, async (req, res) => {
  try {
    const allAdvisers = await prisma.adviser.findMany({
      select: { id: true, adviserId: true, name: true, email: true },
    });

    if (!allAdvisers.length) {
      return res.status(400).json(errorResponse('No advisers to delete'));
    }

    const deletedAdvisers = [];
    for (const adviser of allAdvisers) {
      await prisma.adviser.delete({ where: { id: adviser.id } });
      deletedAdvisers.push(adviser);
    }

    res.json(successResponse('All advisers deleted successfully', deletedAdvisers));
  } catch (err) {
    console.error('Delete all advisers error:', err);
    res.status(500).json(errorResponse('Failed to delete all advisers', err.message));
  }
});

// DELETE multiple advisers (bulk) via body JSON
router.delete('/', verifyAdmin, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(i => parseInt(i)) : [];
  if (!ids.length) {
    return res.status(400).json(errorResponse('No adviser ID(s) provided'));
  }

  const deletedAdvisers = [];
  const errors = [];

  for (const id of ids) {
    const adviser = await prisma.adviser.findUnique({
      where: { id },
      select: { id: true, adviserId: true, name: true, email: true },
    });

    if (!adviser) {
      errors.push({ id, message: 'Adviser not found' });
      continue;
    }

    await prisma.adviser.delete({ where: { id } });
    deletedAdvisers.push(adviser);
  }

  res.json(successResponse('Adviser(s) processed successfully', {
    deleted: deletedAdvisers,
    failed: errors,
  }));
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