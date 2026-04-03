// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { verifyAdviser } = require("../../middleware/authMiddleware");

// ?[GET] Get all events
router.get("/", verifyAdviser, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.json(successResponse("Events retrieved successfully", { events }));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to retrieve events", err.message));
  }
});

module.exports = router;
