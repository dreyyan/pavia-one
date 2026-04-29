// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Libraries
const fs = require("fs");
const path = require("path");

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");

// [IMPORT] Services
const {
  resolveAdviserSection,
} = require("../../services/node/adviser_service");

// [IMPORT] Helpers
const { safeUnlink } = require("../../utils/file");

// [IMPORT] Middleware
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// [IMPORT] Paths
const {
  BASE_DIR,
  SERVICES_DIR,
  FORMS_DIR,
  OUTPUT_DIR,
  UPLOAD_DIR,
} = require("../../services/forms/formPaths");

const {
  SF2_DIR,
  TEMPLATE_PATH,
  IMPORTER_PATH,
  OUTPUT_PATH,
} = require("../../services/forms/config/sf2Config");

// ? [GET] Export SF2 Template
// /api/adviser/sf2/export
router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // [1] Resolve adviser + section
    const resolved = await resolveAdviserSection(req.adviserId);

    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // [2] Check template existence
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(500).json(errorResponse("SF2 template file not found"));
    }

    // [3] Build filename
    const filename = `SF2_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(
      /\s/g,
      "",
    )}.xlsx`;

    // [4] Stream template directly (NO PYTHON, NO PROCESSING)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(TEMPLATE_PATH);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("[SF2 Export] Stream error:", err);

      if (!res.headersSent) {
        res.status(500).json(errorResponse("Failed to download SF2 template"));
      } else {
        res.destroy();
      }
    });
  } catch (err) {
    console.error("[SF2 Export] Unexpected error:", err);

    if (!res.headersSent) {
      res.status(500).json(errorResponse("SF2 export failed", err.message));
    }
  }
});

module.exports = router;
