// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Libraries
const fs = require("fs");
const path = require("path");

// [IMPORT] Helpers
const { runPythonWithJSON } = require("../../utils/pythonRunner");

// [IMPORT] Utilities
const { errorResponse } = require("../../utils/response");
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
const { FORMS_DIR, OUTPUT_DIR } = require("../../services/forms/formPaths");

// SF5 CONFIG (CREATE THIS FILE)
const {
  SF5_DIR,
  TEMPLATE_PATH: SF5_TEMPLATE_PATH,
} = require("../../services/forms/config/sf5Config");

// [PYTHON]
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "../../venv/Scripts/python.exe")
    : path.join(__dirname, "../../venv/bin/python3");

// ? [GET] Export SF5
router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // =========================
    // 1. RESOLVE SECTION
    // =========================
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // =========================
    // 2. FETCH STUDENTS (SF1 STYLE CORE)
    // =========================
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: section.id,
        status: "ENROLLED",
      },
      include: {
        student: {
          include: {
            guardian: true,
            address: true,
          },
        },
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

    // =========================
    // 3. SAFE NORMALIZER
    // =========================
    const safe = (v) => (v ?? "").toString().trim();

    // =========================
    // 4. BUILD SF5 DATA
    // =========================
    const studentsData = enrollments.map((e) => {
      const s = e.student || {};
      const g = s.guardian || {};
      const a = s.address || {};

      return {
        LRN: safe(s.lrn),
        "First Name": safe(s.firstName),
        "Middle Name": safe(s.middleName),
        "Last Name": safe(s.lastName),
        Sex: safe(s.sex),
        "Birth Date": s.birthDate ? new Date(s.birthDate) : "",

        Age: "",

        "Mother Tongue": safe(s.motherTongue),
        Religion: safe(s.religion),

        "Father Name": [
          safe(g.fatherFirstName),
          safe(g.fatherMiddleName),
          safe(g.fatherLastName),
        ]
          .filter(Boolean)
          .join(" "),

        "Mother Maiden Name": [
          safe(g.motherMaidenFirstName),
          safe(g.motherMaidenMiddleName),
          safe(g.motherMaidenLastName),
        ]
          .filter(Boolean)
          .join(" "),

        Barangay: safe(a.barangay),
        Municipality: safe(a.municipalityCity),
        Province: safe(a.province),

        "Learning Modality": safe(e.learningModality),
        Remarks: e.remarks ? String(e.remarks).trim() : "",

        Section: safe(section.name),
        "Grade Level": section.gradeLevel,
        "IP Ethnic Group": safe(s.ethnicGroup),
      };
    });

    // =========================
    // 5. SCHOOL INFO
    // =========================
    const schoolInfo = JSON.parse(
      fs.readFileSync(path.join(FORMS_DIR, "school_data.json"), "utf-8"),
    );

    // =========================
    // 6. ADVISER INFO
    // =========================
    const adviserRecord = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { name: true },
    });

    if (!adviserRecord) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    const normalizedAdviser = splitFullName(adviserRecord.name);

    // =========================
    // 7. OUTPUT PATH
    // =========================
    const outputPath = path.join(OUTPUT_DIR, `SF5_${section.id}_filled.xlsx`);

    // =========================
    // 8. RUN PYTHON WRITER
    // =========================
    try {
      const WRITER_PATH = path.join(SF5_DIR, "sf5_writer.py");

      await runPythonWithJSON(PYTHON_EXE, WRITER_PATH, {
        students: studentsData,
        school: schoolInfo,
        adviser: normalizedAdviser,
        section: {
          name: section.name,
          gradeLevel: section.gradeLevel,
          schoolYear: section.schoolYear,
          curriculum: section.curriculum ?? "", // ✅ FIXED HERE
        },
        paths: {
          templatePath: SF5_TEMPLATE_PATH,
          outputPath,
        },
      });
    } catch (pyErr) {
      console.error("[SF5 Export] Python error:", pyErr.stderr || pyErr);

      return res
        .status(500)
        .json(errorResponse("Failed to generate SF5 Excel file", pyErr.stderr));
    }

    // =========================
    // 9. FILE CHECK
    // =========================
    if (!fs.existsSync(outputPath)) {
      return res
        .status(500)
        .json(errorResponse("SF5 Excel file was not generated"));
    }

    // =========================
    // 10. STREAM FILE
    // =========================
    const filename = `SF5_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(
      /\s/g,
      "",
    )}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    stream.on("end", () => safeUnlink(outputPath));

    stream.on("error", (err) => {
      console.error("[SF5 Export] Stream error:", err);

      if (!res.headersSent) {
        res.status(500).json(errorResponse("Failed to stream SF5 Excel file"));
      } else {
        res.destroy();
      }
    });
  } catch (err) {
    console.error("[SF5 Export] Unexpected error:", err);

    if (!res.headersSent) {
      res.status(500).json(errorResponse("SF5 export failed", err.message));
    }
  }
});

module.exports = router;
