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
const { calculateAge, splitFullName } = require("../../utils/helpers");
const { safeUnlink } = require("../../utils/file");

// [IMPORT] Services
const {
  resolveAdviserSection,
} = require("../../services/node/adviser_service");

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
  SF1_DIR,
  TEMPLATE_PATH,
  IMPORTER_PATH,
  OUTPUT_PATH,
} = require("../../services/forms/config/sf1Config");

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// [SETUP] Python executable path
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "../../venv/Scripts/python.exe")
    : path.join(__dirname, "../../venv/bin/python3");

// [SETUP] Ensure directories exist (ROBUST)
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(BASE_DIR);
ensureDir(SERVICES_DIR);
ensureDir(FORMS_DIR);
ensureDir(SF1_DIR);

// Runtime directories
ensureDir(OUTPUT_DIR);
ensureDir(UPLOAD_DIR);

// ? [POST] Import SF1 File
// /api/sf1/import
router.post(
  "/import",
  verifyAdviser,
  upload.single("sf1File"),
  async (req, res) => {
    const fs = require("fs");
    const path = require("path");

    // [VALIDATION] Check uploaded file existence
    if (!req.file) {
      return res.status(400).json(errorResponse("No file uploaded"));
    }

    console.log("[SF1 IMPORT HIT]", req.adviserId);

    const filePath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();

    // [VALIDATION] Accept only CSV or XLSX
    if (![".xlsx", ".csv"].includes(originalExt)) {
      safeUnlink(filePath);
      return res.status(400).json(errorResponse("Invalid file type"));
    }

    const namedPath = filePath + originalExt;

    // [FILESYSTEM] Restore file extension for Python compatibility
    try {
      fs.renameSync(filePath, namedPath);
    } catch {
      safeUnlink(filePath);
      return res.status(500).json(errorResponse("File processing failed"));
    }

    let result;

    // [PYTHON RUN] Execute SF1 importer script
    try {
      result = await runPythonWithFile(PYTHON_EXE, IMPORTER_PATH, namedPath);
    } catch (pyErr) {
      safeUnlink(namedPath);
      return res
        .status(500)
        .json(errorResponse("Python importer failed", pyErr.stderr || pyErr));
    }

    // [CLEANUP] Remove uploaded temp file
    safeUnlink(namedPath);

    // [VALIDATION] Ensure Python returned output
    if (!result.stdout) {
      return res.status(500).json(errorResponse("Empty Python output"));
    }

    let students;

    // [PARSE] Convert Python JSON output → JS object
    try {
      students = JSON.parse(result.stdout);
    } catch (err) {
      console.log(result.stdout);
      return res
        .status(500)
        .json(errorResponse("Invalid parser output", err.message));
    }

    // [VALIDATION] Ensure valid student array
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json(errorResponse("No students found"));
    }

    // [SECTION] Resolve Adviser Section
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const section = resolved.section;

    // [HELPER] Normalize optional remarks field
    const normalizeRemarks = (value) => {
      if (typeof value !== "string") return null;
      const cleaned = value.trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    // [RESULT TRACKING] Import summary counters
    const results = {
      created: 0,
      updated: 0,
      enrolled: 0,
      sf9Created: 0,
      errors: [],
    };

    // [PROCESS] Iterate imported students
    for (const s of students) {
      // [VALIDATION] Required fields check
      if (!s.lrn || !s.firstName || !s.lastName) {
        results.errors.push({ lrn: s.lrn || "?", reason: "Missing fields" });
        continue;
      }

      try {
        // [DB] Check existing student
        const existing = await prisma.student.findUnique({
          where: { lrn: s.lrn },
        });

        const remarks = normalizeRemarks(s.remarks);

        // [DATA] Normalize student payload
        const studentData = {
          lrn: s.lrn,
          firstName: s.firstName,
          middleName: s.middleName || null,
          lastName: s.lastName,
          sex: s.sex || "MALE",
          birthDate: s.birthDate ? new Date(s.birthDate) : null,
          motherTongue: s.motherTongue || null,
          ethnicGroup: s.ethnicGroup || null,
          religion: s.religion || null,
          createdByAdviserId: req.adviserId,
        };

        // [DATA] Address payload
        const addressData = {
          create: {
            streetAddress: null,
            barangay:
              s.address?.create?.barangay || s.address?.barangay || null,
            municipalityCity:
              s.address?.create?.municipalityCity ||
              s.address?.municipalityCity ||
              null,
            province:
              s.address?.create?.province || s.address?.province || null,
          },
        };

        // [DATA] Guardian payload
        const guardianData = {
          create: {
            fatherFirstName: s.guardian?.create?.fatherFirstName || null,
            fatherMiddleName: s.guardian?.create?.fatherMiddleName || null,
            fatherLastName: s.guardian?.create?.fatherLastName || null,
            motherMaidenFirstName:
              s.guardian?.create?.motherMaidenFirstName || null,
            motherMaidenMiddleName:
              s.guardian?.create?.motherMaidenMiddleName || null,
            motherMaidenLastName:
              s.guardian?.create?.motherMaidenLastName || null,
          },
        };

        let studentId;

        // [DB] Create or update student
        if (!existing) {
          const created = await prisma.student.create({
            data: {
              ...studentData,
              address: addressData,
              guardian: guardianData,
            },
          });

          studentId = created.id;
          results.created++;
        } else {
          const updated = await prisma.student.update({
            where: { lrn: s.lrn },
            data: {
              ...studentData,
              address: addressData,
              guardian: guardianData,
            },
          });

          studentId = updated.id;
          results.updated++;
        }

        // [DB] Enrollment upsert
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId,
            sectionId: section.id,
          },
        });

        if (!enrollment) {
          await prisma.enrollment.create({
            data: {
              studentId,
              sectionId: section.id,
              schoolYear: section.schoolYear,
              learningModality: s.learningModality || "FACE_TO_FACE",
              status: "ENROLLED",
              remarks,
            },
          });

          results.enrolled++;
        } else {
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              learningModality:
                s.learningModality || enrollment.learningModality,
              remarks: remarks !== null ? remarks : enrollment.remarks,
            },
          });

          results.updated++;
        }
      } catch (err) {
        // [ERROR HANDLING] Per-student failure tracking
        results.errors.push({
          lrn: s.lrn,
          reason: err.message,
        });
      }
    }

    // [RESPONSE] Import summary
    return res.json(successResponse("Import complete", { section, results }));
  },
);

// ? [GET] Export SF1 — build Excel from DB data and stream it
router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // [1] Resolve adviser + section
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // [2] Fetch enrolled students
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

    // REQUIRED FIELDS CHECK
    const REQUIRED = [
      "LRN",
      "First Name",
      "Last Name",
      "Sex",
      "Birth Date",
      "Mother Tongue",
      "Religion",
      "Barangay",
      "Municipality",
      "Province",
      "Father Name",
      "Mother Maiden Name",
      "Learning Modality",
    ];

    // SAFE NORMALIZER
    const safe = (v) => (v ?? "").toString().trim();

    // BUILD STUDENT DATA
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
        Age: calculateAge(s.birthDate),

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
        "Grade Level": `Grade ${section.gradeLevel}`,
        "IP Ethnic Group": safe(s.ethnicGroup),
      };
      console.log("[NODE REMARKS RAW]", e.remarks);
    });

    // VALIDATION
    const incomplete = studentsData
      .map((s, i) => {
        const missing = REQUIRED.filter(
          (f) => !s[f] || !s[f].toString().trim(),
        );

        return missing.length
          ? {
              index: i + 1,
              name: `${s["Last Name"]}, ${s["First Name"]}`,
              missing,
            }
          : null;
      })
      .filter(Boolean);

    if (incomplete.length) {
      console.warn("[SF1 Export] Incomplete students detected:", incomplete);
    }

    const outputPath = path.join(OUTPUT_DIR, `SF1_${section.id}_filled.xlsx`);

    let result;

    try {
      const WRITER_PATH = path.join(
        __dirname,
        "../../services/python/sf/sf1/sf1_writer.py",
      );
      const schoolInfo = JSON.parse(
        fs.readFileSync(path.join(FORMS_DIR, "school_data.json"), "utf-8"),
      );

      const adviserRecord = await prisma.adviser.findUnique({
        where: { adviserId: req.adviserId },
        select: {
          name: true,
        },
      });

      const normalizedAdviser = splitFullName(adviserRecord.name);

      result = await runPythonWithJSON(PYTHON_EXE, WRITER_PATH, {
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
          outputPath: outputPath,
        },
      });
    } catch (pyErr) {
      console.error("[SF1 Export] Python error:", pyErr.stderr || pyErr);
      return res
        .status(500)
        .json(errorResponse("Failed to generate SF1 Excel file", pyErr.stderr));
    }

    // FILE CHECK
    if (!fs.existsSync(outputPath)) {
      return res
        .status(500)
        .json(errorResponse("Excel file was not generated by Python"));
    }

    // STREAM FILE
    const filename = `SF1_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(/\s/g, "")}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    stream.on("end", () => safeUnlink(outputPath));

    stream.on("error", (err) => {
      console.error("[SF1 Export] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json(errorResponse("Failed to stream Excel file"));
      } else {
        res.destroy();
      }
    });
  } catch (err) {
    console.error("[SF1 Export] Unexpected error:", err);

    if (!res.headersSent) {
      res.status(500).json(errorResponse("Export failed", err.message));
    }
  }
});

module.exports = router;
