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

// ?[POST] Adviser Login
// /api/auth/adviser/login
router.post('/login', async (req, res) => {
    const { adviserIdOrEmail, password, rememberMe } = req.body;

    try {
        const adviser = await prisma.adviser.findFirst({
            where: {
                OR: [
                    { adviserId: adviserIdOrEmail },
                    { email: adviserIdOrEmail }
                ]
            }
        });

        if (!adviser) {
            return res.status(404).json(errorResponse("Adviser not found"));
        }

        const isMatch = await bcrypt.compare(password, adviser.password);
        if (!isMatch) {
            return res.status(401).json(errorResponse("Invalid password"));
        }

        const expiresIn = rememberMe ? "7d" : "1h";

        const token = jwt.sign(
            { adviserId: adviser.id, role: 'adviser' }, 
            process.env.JWT_SECRET, 
            { expiresIn }
        );

        const { password: _, ...adviserWithoutPassword } = adviser;
        res.status(200).json(successResponse("Login successful", { adviser: adviserWithoutPassword, token }));
    } catch (err) {
        res.status(400).json(errorResponse("Failed to log in adviser", err.message));
    }
});

module.exports = router;