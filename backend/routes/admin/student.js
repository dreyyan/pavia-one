// routes/admin/students.js
const express = require('express');
const router = express.Router();

const prisma = require('../../lib/prisma');  // adjust path based on your structure (from backend/routes/admin/ → ../../lib/prisma)

require('dotenv').config();
const jwt = require('jsonwebtoken');

const { successResponse, errorResponse } = require('../../utils/response');  // adjust path

// ────────────────────────────────────────────────
// Middleware: Verify ADMIN JWT
// (Assumes your JWT payload includes { id, role: 'admin' })
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json(errorResponse('Admin access required'));
    }
    req.adminId = decoded.id;  // or decoded.adminId – depending on your token structure
    next();
  } catch (err) {
    return res.status(401).json(errorResponse('Invalid or expired token'));
  }
};

// ────────────────────────────────────────────────
// GET /api/admin/students
// List all students (paginated, searchable, admin-only)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,           // reasonable default for 5,000+ students
      search = '',          // optional search by name / studentId / email
      sortBy = 'name',      // name, studentId, createdAt
      sortOrder = 'asc',
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

// Optional future endpoints (add when needed)
// GET /api/admin/students/:id
// PUT /api/admin/students/:id (update student record)
// DELETE /api/admin/students/:id (soft delete / archive)

module.exports = router;