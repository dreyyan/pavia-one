// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyStudent = require('../../middleware/authMiddleware').verifyStudent;

// Helper: build full name
const getFullName = (student) =>
  [student.firstName, student.middleName, student.lastName, student.nameExtension]
    .filter(Boolean)
    .join(' ');

// ?[GET] Retrieve student's own profile (protected)
// /api/student/profile
router.get('/profile', verifyStudent, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { lrn: req.lrn }, // use LRN instead of internal ID
      select: {
        id: true,
        lrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        nameExtension: true,
        sex: true,
        birthDate: true,
        motherTongue: true,
        ethnicGroup: true,
        religion: true,
        email: true,
        password: true,
        createdByAdviserId: true,
        accountStatus: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        adviser: { select: { id: true, name: true, adviserId: true } },
        address: true,
        guardian: true,
        enrollments: {
          where: { status: 'ENROLLED' },
          select: { section: { select: { id: true, name: true, gradeLevel: true } } },
          take: 1
        },
        monthlySummaries: true,
        dailyAttendances: true,
        sf9Grades: true,
        sf9Summaries: true,
        sf5Reports: true,
        sf9CoreValues: true,
      },
    });

    // ![ERROR] Student not found
    if (!student) {
      return res.status(404).json(errorResponse('Student not found'));
    }

    // *[SUCCESS] Return student profile
    res.json(successResponse('Profile retrieved', {
      ...student,
      fullName: getFullName(student),
      section: student.enrollments[0]?.section || null,
      enrollments: undefined
    }));

  } catch (err) {
    res.status(500).json(errorResponse('Failed to fetch profile', err.message));
  }
});

// ?[PUT] Update own profile
// /api/student/profile
router.put('/profile', verifyStudent, async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    nameExtension,
    sex,
    birthDate,
    motherTongue,
    ethnicGroup,
    religion,
    email
  } = req.body;

  try {
    // Fetch current student profile
    const student = await prisma.student.findUnique({
      where: { lrn: req.lrn },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        nameExtension: true,
        sex: true,
        birthDate: true,
        motherTongue: true,
        ethnicGroup: true,
        religion: true,
        email: true
      }
    });

    // ![ERROR] Student not found
    if (!student) {
      return res.status(404).json(errorResponse('Student not found'));
    }

    const updates = {};

    // Update string and optional fields only if changed
    if (firstName && firstName !== student.firstName) updates.firstName = firstName;
    if (middleName !== undefined && middleName !== student.middleName) updates.middleName = middleName || null;
    if (lastName && lastName !== student.lastName) updates.lastName = lastName;
    if (nameExtension !== undefined && nameExtension !== student.nameExtension) updates.nameExtension = nameExtension || null;
    if (sex && sex !== student.sex) updates.sex = sex;
    if (birthDate && new Date(birthDate).toISOString() !== student.birthDate.toISOString()) updates.birthDate = new Date(birthDate);
    if (motherTongue !== undefined && motherTongue !== student.motherTongue) updates.motherTongue = motherTongue || null;
    if (ethnicGroup !== undefined && ethnicGroup !== student.ethnicGroup) updates.ethnicGroup = ethnicGroup || null;
    if (religion !== undefined && religion !== student.religion) updates.religion = religion || null;

    // Handle email separately
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== student.email?.toLowerCase()) {
        const existing = await prisma.student.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== student.id) {
          return res.status(409).json(errorResponse('Email already in use'));
        }
        updates.email = normalizedEmail;
      }
    }

    // ![ERROR] Nothing to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json(errorResponse('No changes detected'));
    }

    // Update student profile
    const updated = await prisma.student.update({
      where: { lrn: req.lrn },
      data: updates,
      select: {
        id: true,
        lrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        nameExtension: true,
        sex: true,
        birthDate: true,
        motherTongue: true,
        ethnicGroup: true,
        religion: true,
        email: true,
        updatedAt: true
      }
    });

    // *[SUCCESS] Return updated profile
    res.json(successResponse('Profile updated successfully', {
      ...updated,
      fullName: getFullName(updated)
    }));

  } catch (err) {
    // Prisma unique constraint handling
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json(errorResponse('Email already in use'));
    }
    res.status(500).json(errorResponse('Failed to update profile', err.message));
  }
});

// ?[PUT] Change own password
// /api/student/change-password
router.put('/change-password', verifyStudent, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // ![ERROR] Missing fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json(errorResponse('Current and new passwords are required'));
  }

  try {
    const student = await prisma.student.findUnique({
      where: { lrn: req.lrn },
      select: { password: true }
    });

    // ![ERROR] Student not found
    if (!student) {
      return res.status(404).json(errorResponse('Student not found'));
    }

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isCurrentMatch) {
      return res.status(401).json(errorResponse('Current password is incorrect'));
    }

    // Prevent updating to the same password
    const isSameAsCurrent = await bcrypt.compare(newPassword, student.password);
    if (isSameAsCurrent) {
      return res.status(400).json(errorResponse('New password cannot be the same as the current password'));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset mustChangePassword flag
    await prisma.student.update({
      where: { lrn: req.lrn },
      data: { password: hashedPassword, mustChangePassword: false }
    });

    // *[SUCCESS] Password updated
    res.json(successResponse('Password updated successfully'));
  } catch (err) {
    res.status(500).json(errorResponse('Failed to update password', err.message));
  }
});

module.exports = router;