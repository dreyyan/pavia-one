// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdmin = require('../../middleware/authMiddleware').verifyAdmin;

// ?[PUT] Force password reset for a student or adviser
// /api/admin/users/:type/:id/force-password-reset
// :type = 'student' or 'adviser'
// :id = student LRN or adviserId
router.put('/:type/:id/force-password-reset', verifyAdmin, async (req, res) => {
    const { type, id } = req.params;

    try {
        let updatedUser;

        if (type === 'student') {
            // Check if student exists
            const student = await prisma.student.findUnique({
                where: { lrn: id },
                select: { lrn: true, name: true, email: true, mustChangePassword: true }
            });

            if (!student) {
                return res.status(404).json(errorResponse('Student not found'));
            }

            // Update mustChangePassword
            updatedUser = await prisma.student.update({
                where: { lrn: id },
                data: { mustChangePassword: true },
                select: { lrn: true, name: true, email: true, mustChangePassword: true }
            });
        } else if (type === 'adviser') {
            // Check if adviser exists
            const adviser = await prisma.adviser.findUnique({
                where: { adviserId: id },
                select: { adviserId: true, name: true, email: true, mustChangePassword: true }
            });

            if (!adviser) {
                return res.status(404).json(errorResponse('Adviser not found'));
            }

            // Update mustChangePassword
            updatedUser = await prisma.adviser.update({
                where: { adviserId: id },
                data: { mustChangePassword: true },
                select: { adviserId: true, name: true, email: true, mustChangePassword: true }
            });
        } else {
            return res.status(400).json(errorResponse('Invalid type. Must be "student" or "adviser"'));
        }

        // *[SUCCESS] Return updated user
        res.json(successResponse('Password reset enforced successfully', updatedUser));

    } catch (err) {
        res.status(500).json(errorResponse('Failed to enforce password reset', err.message));
    }
});

module.exports = router;