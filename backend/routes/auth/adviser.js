// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Tools
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { hashPassword } = require("../../utils/helpers");

// ?[POST] Adviser Sign Up
// /api/auth/adviser/sign-up
router.post("/sign-up", async (req, res) => {
  const { adviserId, name, email, password } = req.body;

  try {
    // Check if adviserId or email already exists
    const existing = await prisma.adviser.findFirst({
      where: {
        OR: [{ adviserId }, { email }],
      },
    });

    if (existing) {
      return res
        .status(409)
        .json(errorResponse("Adviser ID or email already registered"));
    }

    // ?Hash password
    const hashedPassword = await hashPassword(password);

    // ?Create new adviser record
    const newAdviser = await prisma.adviser.create({
      data: { adviserId, name, email, password: hashedPassword },
    });

    // ?Remove password from response
    const { password: _, ...adviserWithoutPassword } = newAdviser;
    res
      .status(201)
      .json(
        successResponse("Adviser created successfully", adviserWithoutPassword),
      );
  } catch (err) {
    res
      .status(400)
      .json(errorResponse("Failed to create adviser", err.message));
  }
});

// ?[POST] Adviser Login
// /api/auth/adviser/login
router.post("/login", async (req, res) => {
  const { identifier, password, rememberMe } = req.body; // <--- match frontend

  try {
    // ?Find adviser by ID (identifier)
    const adviser = await prisma.adviser.findFirst({
      where: { adviserId: identifier },
    });

    // ![ERROR] Adviser not found
    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // ?Check if passwords match
    const isMatch = await bcrypt.compare(password, adviser.password);

    // ![ERROR] Invalid password
    if (!isMatch) {
      return res.status(401).json(errorResponse("Invalid password"));
    }

    // ?Set token expiration based on rememberMe
    const expiresIn = rememberMe ? "7d" : "1h";

    // ?Sign JWT token
    const token = jwt.sign(
      { adviserId: adviser.adviserId, role: "adviser" },
      process.env.JWT_SECRET,
      { expiresIn },
    );

    // ?Remove password from response
    const { password: _, ...adviserWithoutPassword } = adviser;

    // *[SUCCESS] Login successful
    res
      .status(200)
      .json(
        successResponse("Login successful", {
          adviser: adviserWithoutPassword,
          token,
        }),
      );
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json(errorResponse("Failed to log in adviser", err.message));
  }
});

module.exports = router;
