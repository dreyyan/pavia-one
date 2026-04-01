// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const { verifyAdmin } = require("../../middleware/authMiddleware");

// ?[GET] Get all events
router.get("/", verifyAdmin, async (req, res) => {
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

// ?[POST] Create new event
router.post("/", verifyAdmin, async (req, res) => {
  console.log("req.adminId:", req.adminId);
  console.log("req.body:", req.body);
  try {
    const { title, description, location, type, startDate, endDate, isOnline } =
      req.body;
    const createdById = req.adminId;

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        location,
        type,
        startDate,
        endDate,
        isOnline,
        createdById,
      },
    });

    res.json(
      successResponse("Event created successfully", { event: newEvent }),
    );
  } catch (err) {
    res.status(500).json(errorResponse("Failed to create event", err.message));
  }
});

// ?[PUT] Update an event
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, type, startDate, endDate, isOnline } =
      req.body;

    const updated = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        location,
        type,
        startDate,
        endDate,
        isOnline,
      },
    });

    res.json(successResponse("Event updated successfully", { event: updated }));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to update event", err.message));
  }
});

// ?[DELETE] Delete an event
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id: Number(id) } });

    res.json(successResponse("Event deleted successfully"));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to delete event", err.message));
  }
});

module.exports = router;
