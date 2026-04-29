// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Libraries
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// [IMPORT] Helpers
const {
  runPythonWithJSON,
  runPythonWithFile,
} = require("../../utils/pythonRunner");

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");
const { splitFullName } = require("../../utils/helpers");

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

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// [SETUP] Python executable path
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "../../venv/Scripts/python.exe")
    : path.join(__dirname, "../../venv/bin/python3");

router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // [1] Resolve adviser + section
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // [2] Fetch enrolled students (COPY FROM SF1)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: section.id,
        status: "ENROLLED",
      },
      include: {
        student: true,
      },
      orderBy: {
        student: {
          lastName: "asc",
        },
      },
    });

    if (!enrollments.length) {
      return res
        .status(404)
        .json(errorResponse("No enrolled students found in this section"));
    }

    // [3] SAFE NORMALIZER
    const safe = (v) => (v ?? "").toString().trim();

    // [4] BUILD STUDENTS DATA (MINIMAL SF2 VERSION)
    const studentsData = enrollments.map((e) => {
      const s = e.student || {};

      return {
        LRN: safe(s.lrn),
        "First Name": safe(s.firstName),
        "Middle Name": safe(s.middleName),
        "Last Name": safe(s.lastName),
        Sex: safe(s.sex),
        "Birth Date": s.birthDate ? new Date(s.birthDate) : "",
        MotherTongue: safe(s.motherTongue),
        Religion: safe(s.religion),
        Barangay: safe(s.barangay),
        Municipality: safe(s.municipalityCity),
        Province: safe(s.province),
        LearningModality: safe(e.learningModality),
        Remarks: e.remarks ? String(e.remarks).trim() : "",
        Section: safe(section.name),
        GradeLevel: section.gradeLevel,
      };
    });

    // [5] LOAD SCHOOL INFO
    const schoolInfo = JSON.parse(
      fs.readFileSync(path.join(FORMS_DIR, "school_data.json"), "utf-8"),
    );

    // [6] ADVISER INFO (SF1 STYLE CONSISTENCY)
    const adviserRecord = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { name: true },
    });

    if (!adviserRecord) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    const normalizedAdviser = splitFullName(adviserRecord.name);

    // [7] OUTPUT PATH
    const outputPath = path.join(OUTPUT_DIR, `SF2_${section.id}_filled.xlsx`);

    // [8] RUN PYTHON WRITER
    try {
      const WRITER_PATH = path.join(SF2_DIR, "sf2_writer.py");

      await runPythonWithJSON(PYTHON_EXE, WRITER_PATH, {
        students: studentsData,
        school: schoolInfo,
        adviser: normalizedAdviser,
        section: {
          name: section.name,
          gradeLevel: section.gradeLevel,
          schoolYear: section.schoolYear,
        },
        paths: {
          templatePath: TEMPLATE_PATH,
          outputPath,
        },
      });
    } catch (pyErr) {
      console.error("[SF2 Export] Python error:", pyErr.stderr || pyErr);

      return res
        .status(500)
        .json(errorResponse("Failed to generate SF2 Excel file", pyErr.stderr));
    }

    // [9] FILE CHECK
    if (!fs.existsSync(outputPath)) {
      return res
        .status(500)
        .json(errorResponse("SF2 Excel file was not generated"));
    }

    // [10] STREAM FILE
    const filename = `SF2_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(/\s/g, "")}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    stream.on("end", () => safeUnlink(outputPath));

    stream.on("error", (err) => {
      console.error("[SF2 Export] Stream error:", err);

      if (!res.headersSent) {
        res.status(500).json(errorResponse("Failed to stream SF2 Excel file"));
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
