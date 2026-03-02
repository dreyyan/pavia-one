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

module.exports = router;