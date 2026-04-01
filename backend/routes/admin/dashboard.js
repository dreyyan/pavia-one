// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const verifyAdmin = require("../../middleware/authMiddleware").verifyAdmin;

// ?[GET] Dashboard summary (protected)
// /api/admin/dashboard/summary
router.get("/summary", verifyAdmin, async (req, res) => {
  // [DEBUG] Check if user from middleware exists
  console.log("[DEBUG] user from token:", req.user);

  // ![ERROR] Missing user from token
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(401)
      .json(errorResponse("Unauthorized: admin info missing"));
  }

  // [DEBUG] Check adminId set by middleware
  console.log("[DEBUG] adminId from middleware:", req.adminId);

  if (!req.adminId) {
    return res
      .status(401)
      .json(errorResponse("Unauthorized: admin info missing"));
  }

  const adminId = req.adminId; // use this for fetching profile

  try {
    // ?[FETCH] Admin profile
    const adminProfile = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ![ERROR] Admin not found
    if (!adminProfile) {
      return res.status(404).json(errorResponse("Admin not found"));
    }

    // ?[FETCH] Counts
    const [totalStudents, totalSections, totalAdvisers, totalAdmins] =
      await Promise.all([
        prisma.student.count(),
        prisma.section.count(),
        prisma.adviser.count(),
        prisma.admin.count(),
      ]);

    // *[SUCCESS] Return profile + counts
    res.json(
      successResponse("Dashboard summary retrieved successfully", {
        adminProfile,
        totalStudents,
        totalSections,
        totalAdvisers,
        totalAdmins,
      }),
    );
  } catch (err) {
    // ![ERROR] Failed to fetch dashboard summary
    console.error("Dashboard summary error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch dashboard summary", err.message));
  }
});

module.exports = router;
