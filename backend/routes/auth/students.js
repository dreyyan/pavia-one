// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// [IMPORT] Tools
require('dotenv').config();
const jwt = require('jsonwebtoken');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../utils/response');
const { hashPassword } = require("../../utils/helpers")

// ?[POST] Student Sign Up
// /api/auth/sign-up
router.post('/sign-up', async (req, res) => {
    const { studentId, name, email, password } = req.body;
    
    try {
        // Check if studentId or email already exists
        const existing = await prisma.student.findFirst({
            where: {
                OR: [
                    { studentId },
                    { email }
                ]
            }
        });

        if (existing) {
            return res.status(409).json(errorResponse("Student ID or email already registered"));
        }

        const hashedPassword = await hashPassword(password);

        const newStudent = await prisma.student.create({
            data: { studentId, name, email, password: hashedPassword }
        });

        const { password: _, ...studentWithoutPassword } = newStudent; // Remove password
        res.status(201).json(successResponse("Student created successfully", studentWithoutPassword));
    } catch (err) {
        res.status(400).json(errorResponse("Failed to create student", err.message));
    }
});

// ?[POST] Student Login
// /api/auth/login
router.post('/login', async (req, res) => {
    const { studentIdOrEmail, password, rememberMe } = req.body;

    try {
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { studentId: studentIdOrEmail },
                    { email: studentIdOrEmail }
                ]
            }
        });

        if (!student) {
            return res.status(404).json(errorResponse("Student not found"));
        }

        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(401).json(errorResponse("Invalid password"));
        }

        // Remember me: token expires in 1h or 7d
        const expiresIn = rememberMe ? "7d" : "1h";

        const token = jwt.sign(
            { studentId: student.id }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        const { password: _, ...studentWithoutPassword } = student;
        res.status(200).json(successResponse("Login successful", { student: studentWithoutPassword, token }));
    } catch (err) {
        res.status(400).json(errorResponse("Failed to log in student", err.message));
    }
});

module.exports = router;