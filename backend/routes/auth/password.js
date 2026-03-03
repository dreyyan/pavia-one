// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const crypto = require('crypto');

// [IMPORT] Tools
require('dotenv').config();
const bcrypt = require('bcrypt');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const { hashPassword } = require("../../utils/helpers")
const { sendResetEmail } = require("../../utils/email");

// Utility to get the correct model based on role
const getModelByRole = (role) => {
    if (role === 'admin') return prisma.admin;
    if (role === 'adviser') return prisma.adviser;
    return null;
};

// ?[POST] Forgot Password
// /api/auth/password/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email, role } = req.body;

    try {
        // ![ERROR] Email is required
        if (!email) return res.status(400).json(errorResponse("Email is required"));

        // ![ERROR] Role is required
        if (!role || !['admin', 'adviser'].includes(role)) {
            return res.status(400).json(errorResponse("Role must be 'admin' or 'adviser'"));
        }

        const model = getModelByRole(role);

        const user = await model.findFirst({ where: { email } });

        // Always return success (security)
        if (!user) return res.status(200).json(successResponse("If an account exists, a reset link was sent"));

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before saving
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        // Set token expiry (1 hour)
        const expiry = new Date(Date.now() + 3600000);

        await model.update({
            where: { id: user.id },
            data: { resetToken: hashedToken, resetTokenExpiry: expiry }
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}?role=${role}`;

        // ? Send email in production
        await sendResetEmail(email, resetLink);
        console.log(`[${role.toUpperCase()}] Reset email sent to ${email}`);

        // *[SUCCESS] Reset link generated
        res.status(200).json(successResponse("If an account exists, a reset link was sent"));

    } catch (err) {
        res.status(400).json(errorResponse("Failed to process forgot password", err.message));
    }
});

// ?[POST] Reset Password
// /api/auth/password/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, role } = req.body;

    try {
        // ![ERROR] Password is required
        if (!password) 
            return res.status(400).json(errorResponse("Password is required"));

        // ![ERROR] Role is required
        if (!role || !['admin', 'adviser'].includes(role)) {
            return res.status(400).json(errorResponse("Role must be 'admin' or 'adviser'"));
        }

        const model = getModelByRole(role);

        // Hash incoming token to match DB
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const now = new Date();

        // Find user with valid reset token
        const user = await model.findFirst({
            where: { resetToken: hashedToken, resetTokenExpiry: { gt: now } }
        });

        // ![ERROR] Invalid or expired token
        if (!user) return res.status(400).json(errorResponse("Invalid or expired token"));

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.status(400).json(errorResponse("New password cannot be the same as the current password"));
        }

        // Hash new password and update user
        const hashedPassword = await hashPassword(password);
        await model.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
        });

        // *[SUCCESS] Password reset successful
        res.status(200).json(successResponse("Password reset successful"));

    } catch (err) {
        res.status(400).json(errorResponse("Failed to reset password", err.message));
    }
});

module.exports = router;