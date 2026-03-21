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
const { hashPassword } = require("../../utils/helpers")

// ?[POST] Admin Sign Up
// /api/auth/admin/sign-up
router.post('/sign-up', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if username or email already exists
        const existing = await prisma.admin.findFirst({
            where: { username }
        });

        // ![ERROR] Username or email already registered
        if (existing) {
            return res.status(409).json(errorResponse("Username or email already registered"));
        }

        const hashedPassword = await hashPassword(password);

        const newAdmin = await prisma.admin.create({
            data: { username, email, password: hashedPassword }
        });

        const { password: _, ...adminWithoutPassword } = newAdmin; // Remove password

        // *[SUCCESS] Admin created successfully
        res.status(201).json(successResponse("Admin created successfully", adminWithoutPassword));
    } catch (err) {
        res.status(400).json(errorResponse("Failed to create admin", err.message));
    }
});

// ?[POST] Admin Login
// /api/auth/admin/login
router.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;

    try {
        // Find admin by username
        const admin = await prisma.admin.findFirst({
            where: { username: username }
        });

        // ![ERROR] Admin not found
        if (!admin) {
            return res.status(404).json(errorResponse("Admin not found"));
        }

        // ?Check if password matches
        const isMatch = await bcrypt.compare(password, admin.password);

        // ![ERROR] Invalid password
        if (!isMatch) {
            return res.status(401).json(errorResponse("Invalid password"));
        }

        // Set token expiration
        const expiresIn = rememberMe ? "7d" : "1h";

        // Generate JWT
        const token = jwt.sign(
            { adminId: admin.id, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        // Remove password from response
        const { password: _, ...adminWithoutPassword } = admin;

        // *[SUCCESS] Login Successful
        res.status(200).json(successResponse("Login successful", { admin: adminWithoutPassword, token }));

    } catch (err) {
        res.status(400).json(errorResponse("Failed to log in admin", err.message));
    }
});

// ?[POST] Bulk Create Admins
// /api/auth/admin/bulk-sign-up
router.post('/bulk-sign-up', async (req, res) => {
  try {
    const adminsInput = Array.isArray(req.body) ? req.body : [req.body];

    if (!adminsInput.length) {
      return res.status(400).json(errorResponse("Request body cannot be empty"));
    }

    const createdAdmins = [];
    const errors = [];

    for (const admin of adminsInput) {
      const { username, email } = admin;
      // Default password if not provided
      const password = admin.password || "admin123";

      if (!username || !email) {
        errors.push({ username, email, message: "Missing required fields" });
        continue;
      }

      // Check if username or email already exists
      const existing = await prisma.admin.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existing) {
        errors.push({ username, email, message: "Username or email already registered" });
        continue;
      }

      try {
        const hashedPassword = await hashPassword(password);

        const newAdmin = await prisma.admin.create({
          data: { username, email, password: hashedPassword }
        });

        const { password: _, ...adminWithoutPassword } = newAdmin;
        createdAdmins.push(adminWithoutPassword);

      } catch (err) {
        errors.push({ username, email, message: err.message });
      }
    }

    res.status(201).json(
      successResponse("Bulk admin creation processed", {
        created: createdAdmins,
        failed: errors
      })
    );

  } catch (err) {
    console.error("Bulk admin creation error:", err);
    res.status(500).json(errorResponse("Failed to bulk create admins", err.message));
  }
});

module.exports = router;