// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { verifyAdmin } = require("../../middleware/authMiddleware");

// ?[GET] Get all announcements
// /api/admin/announcements
router.get("/", verifyAdmin, async (req, res) => {
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

// ?[POST] Create new announcement
// /api/admin/announcements
router.post("/", verifyAdmin, async (req, res) => {
  console.log("req.adminId:", req.adminId);
  console.log("req.body:", req.body);
  try {
    const { title, content, publishedAt, expiresAt } = req.body;
    const createdById = req.adminId;

    const newAnnouncement = await prisma.announcement.create({
      data: { title, content, publishedAt, expiresAt, createdById },
    });

    res.json(
      successResponse("Announcement created successfully", {
        announcement: newAnnouncement,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to create announcement", err.message));
  }
});

// ?[PUT] Update an announcement
// /api/admin/announcements/:id
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, publishedAt, expiresAt } = req.body;

    const updated = await prisma.announcement.update({
      where: { id: Number(id) },
      data: { title, content, publishedAt, expiresAt },
    });

    res.json(
      successResponse("Announcement updated successfully", {
        announcement: updated,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to update announcement", err.message));
  }
});

// ?[DELETE] Delete an announcement
// /api/admin/announcements/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id: Number(id) } });

    res.json(successResponse("Announcement deleted successfully"));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Failed to delete announcement", err.message));
  }
});

module.exports = router;
