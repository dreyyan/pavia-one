// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { verifyAdviser } = require("../../middleware/authMiddleware");

// ?[GET] Get all announcements
router.get("/", verifyAdviser, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.json(
      successResponse("Announcements retrieved successfully", {
        announcements,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to retrieve announcements", err.message));
  }
});

module.exports = router;
