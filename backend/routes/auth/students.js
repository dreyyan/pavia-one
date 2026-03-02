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

// ?[POST] Student Sign Up
// /api/auth/sign-up
router.post('/sign-up', async (req, res) => {
    const { lrn, name, email, password, confirmPassword } = req.body;

    try {
        // 1️⃣ Validate required fields
        if (!lrn || !name || !email || !password || !confirmPassword) {
            return res.status(400).json(errorResponse("All fields are required"));
        }

        // 2️⃣ Validate LRN format (12 digits)
        if (!/^\d{12}$/.test(lrn)) {
            return res.status(400).json(errorResponse("LRN must be a 12-digit number"));
        }

        // 3️⃣ Validate password match
        if (password !== confirmPassword) {
            return res.status(400).json(errorResponse("Passwords do not match"));
        }

        // 4️⃣ Check if LRN or email already exists
        const existing = await prisma.student.findFirst({
            where: {
                OR: [
                    { lrn },
                    { email }
                ]
            }
        });

        if (existing) {
            return res.status(409).json(errorResponse("Student ID or email already registered"));
        }

        // 5️⃣ Hash password
        const hashedPassword = await hashPassword(password);

        const [firstName, ...lastNameParts] = name.trim().split(" ");
        const lastName = lastNameParts.join(" ") || "";

        // 6️⃣ Create new student
        const newStudent = await prisma.student.create({
            data: { lrn, firstName, lastName, email, password: hashedPassword }
        });

        // 7️⃣ Remove password from response
        const { password: _, ...studentWithoutPassword } = newStudent;

        // 8️⃣ Respond success
        res.status(201).json(successResponse("Student created successfully", studentWithoutPassword));
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json(errorResponse("Failed to create student", err.message));
    }
});

// ?[POST] Student Login
// /api/auth/login
router.post('/login', async (req, res) => {
    const { lrn, password, rememberMe } = req.body;

    try {
        const student = await prisma.student.findFirst({
            where: { lrn: req.lrn }
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
            { lrn: student.id }, 
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