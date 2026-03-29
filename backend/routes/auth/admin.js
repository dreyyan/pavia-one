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
const { error } = require("../../utils/logger");

// ?[POST] Admin Sign Up
// /api/auth/admin/sign-up
router.post("/sign-up", async (req, res) => {
  let { username, email, password } = req.body;

  // use default password if not provided
  password = password || "admin123";

  // ![ERROR] Missing required fields
  if (!username || !email) {
    return res
      .status(400)
      .json(errorResponse("Username and email are required"));
  }

  try {
    // ?[VALIDATION] Check if username or email already exists
    const existing = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    // ![ERROR] Username or email already registered
    if (existing)
      return res
        .status(409)
        .json(errorResponse("Username or email already registered"));

    // ?[HASH] Hash password before storing
    const hashedPassword = await hashPassword(password);

    // ?[CREATE] Admin record
    const newAdmin = await prisma.admin.create({
      data: { username, email, password: hashedPassword },
    });

    const { password: _, ...adminWithoutPassword } = newAdmin;

    // *[SUCCESS] Admin created successfully
    res
      .status(201)
      .json(
        successResponse("Admin created successfully", adminWithoutPassword),
      );
  } catch (err) {
    // ![ERROR] Failed to create admin
    res.status(500).json(errorResponse("Failed to create admin", err.message));
  }
});

// ?[POST] Admin Login
// /api/auth/admin/login
router.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;

  // ![ERROR] Missing credentials
  if (!username || !password)
    return res
      .status(400)
      .json(errorResponse("Username and password are required"));

  try {
    // ?[FIND] Admin by username (findFirst avoids unique constraint issues)
    const admin = await prisma.admin.findFirst({ where: { username } });

    // ![ERROR] Admin not found
    if (!admin) return res.status(404).json(errorResponse("Admin not found"));

    // ?[VERIFY] Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json(errorResponse("Invalid password"));

    // ?[JWT] Set expiration
    const expiresIn = rememberMe ? "7d" : "16h";

    // ?[JWT GENERATION] Sign token with adminId
    const token = jwt.sign(
      { adminId: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn },
    );

    const { password: _, ...adminWithoutPassword } = admin;

    // *[SUCCESS] Login successful
    res.status(200).json(
      successResponse("Login successful", {
        admin: adminWithoutPassword,
        token,
      }),
    );
  } catch (err) {
    // ![ERROR] Login failed
    error("Admin login error:", err);
    res.status(500).json(errorResponse("Failed to log in admin", err.message));
  }
});

// ?[POST] Bulk Create Admins
// /api/auth/admin/bulk-sign-up
router.post("/bulk-sign-up", async (req, res) => {
  try {
    const adminsInput = Array.isArray(req.body) ? req.body : [req.body];

    // ![ERROR] Empty request body
    if (!adminsInput.length)
      return res
        .status(400)
        .json(errorResponse("Request body cannot be empty"));

    const createdAdmins = [];
    const errors = [];

    for (const admin of adminsInput) {
      const { username, email } = admin;
      const password = admin.password || "admin123"; // default password

      // ![ERROR] Missing fields
      if (!username || !email) {
        errors.push({ username, email, message: "Missing required fields" });
        continue;
      }

      // ?[VALIDATION] Check if username/email already exists
      const existing = await prisma.admin.findFirst({
        where: { OR: [{ username }, { email }] },
      });

      // ![ERROR] Already registered
      if (existing) {
        errors.push({
          username,
          email,
          message: "Username or email already registered",
        });
        continue;
      }

      try {
        // ?[HASH] Hash password
        const hashedPassword = await hashPassword(password);

        // ?[CREATE] Admin
        const newAdmin = await prisma.admin.create({
          data: { username, email, password: hashedPassword },
        });

        const { password: _, ...adminWithoutPassword } = newAdmin;
        createdAdmins.push(adminWithoutPassword);
      } catch (err) {
        // ![ERROR] Failed to create admin
        errors.push({ username, email, message: err.message });
      }
    }

    // *[SUCCESS] Bulk admin creation processed
    res.status(201).json(
      successResponse("Bulk admin creation processed", {
        created: createdAdmins,
        failed: errors,
      }),
    );
  } catch (err) {
    // ![ERROR] Failed to process bulk creation
    error("Bulk admin creation error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to bulk create admins", err.message));
  }
});

module.exports = router;
