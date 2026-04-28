// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Libraries
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");

// [IMPORT] Services
const {
  resolveAdviserSection,
} = require("../../services/node/adviser_service");

// [IMPORT] Helpers
const {
  runPythonWithJSON,
  runPythonWithFile,
} = require("../../utils/pythonRunner");

const { calculateAge } = require("../../utils/helpers");
const { safeUnlink } = require("../../utils/file");

// [IMPORT] Middleware
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// [SETUP] Paths
const BASE_DIR = path.resolve(__dirname, "../..");

const SERVICES_DIR = path.join(BASE_DIR, "services");
const FORMS_DIR = path.join(BASE_DIR, "forms");
const OUTPUT_DIR = path.join(FORMS_DIR, "output_data");

// [SETUP] Python SF1 Paths
const SF1_DIR = path.join(SERVICES_DIR, "python", "sf", "sf1");

const IMPORTER_PATH = path.join(SF1_DIR, "sf1_import_runner.py");
const PARSER_PATH = path.join(SF1_DIR, "parsers", "sf1_xlsx_parser.py");

// [SETUP] Template
const TEMPLATE_PATH = path.join(FORMS_DIR, "SF1_template.xlsx");

// [SETUP] Uploads
const UPLOAD_DIR = path.join(BASE_DIR, "tmp");

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// [SETUP] Python executable path
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "../../venv/Scripts/python.exe")
    : path.join(__dirname, "../../venv/bin/python3");

// [SETUP] Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

router.post(
  "/import",
  verifyAdviser,
  upload.single("sf1File"),
  async (req, res) => {
    const fs = require("fs");
    const path = require("path");

    if (!req.file) {
      return res.status(400).json(errorResponse("No file uploaded"));
    }

    console.log("[SF1 IMPORT HIT]", req.adviserId);

    const filePath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();

    if (![".xlsx", ".csv"].includes(originalExt)) {
      safeUnlink(filePath);
      return res.status(400).json(errorResponse("Invalid file type"));
    }

    const namedPath = filePath + originalExt;

    try {
      fs.renameSync(filePath, namedPath);
    } catch {
      safeUnlink(filePath);
      return res.status(500).json(errorResponse("File processing failed"));
    }

    let result;

    try {
      result = await runPythonWithFile(PYTHON_EXE, IMPORTER_PATH, namedPath);
    } catch (pyErr) {
      safeUnlink(namedPath);
      return res
        .status(500)
        .json(errorResponse("Python importer failed", pyErr.stderr || pyErr));
    }

    safeUnlink(namedPath);

    if (!result.stdout) {
      return res.status(500).json(errorResponse("Empty Python output"));
    }

    let students;

    try {
      students = JSON.parse(result.stdout);
    } catch (err) {
      console.log(result.stdout);
      return res
        .status(500)
        .json(errorResponse("Invalid parser output", err.message));
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json(errorResponse("No students found"));
    }

    // =========================
    // SECTION RESOLUTION
    // =========================
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const section = resolved.section;

    const normalizeRemarks = (value) => {
      if (typeof value !== "string") return null;
      const cleaned = value.trim();
      return cleaned.length > 0 ? cleaned : null;
    };

    const results = {
      created: 0,
      updated: 0,
      enrolled: 0,
      sf9Created: 0,
      errors: [],
    };

    // =========================
    // PROCESS STUDENTS
    // =========================
    for (const s of students) {
      if (!s.lrn || !s.firstName || !s.lastName) {
        results.errors.push({ lrn: s.lrn || "?", reason: "Missing fields" });
        continue;
      }

      try {
        const existing = await prisma.student.findUnique({
          where: { lrn: s.lrn },
        });

        const remarks = normalizeRemarks(s.remarks);

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

        // =========================
        // ENROLLMENT (FIXED REMARKS HANDLING)
        // =========================
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
              remarks, // ✅ SAFE NULLABLE VALUE
            },
          });

          results.enrolled++;
        } else {
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
              learningModality:
                s.learningModality || enrollment.learningModality,

              // 🔥 IMPORTANT FIX: NEVER overwrite good data with empty string
              remarks: remarks !== null ? remarks : enrollment.remarks,
            },
          });

          results.updated++;
        }
      } catch (err) {
        results.errors.push({
          lrn: s.lrn,
          reason: err.message,
        });
      }
    }

    return res.json(successResponse("Import complete", { section, results }));
  },
);

// ? [GET] Export SF1 — build Excel from DB data and stream it
router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // =========================
    // [1] Resolve adviser + section
    // =========================
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // =========================
    // [2] Fetch enrolled students
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

    console.log("[RAW ENROLLMENT OBJECT SAMPLE]", enrollments[0]);

    if (!enrollments.length) {
      return res
        .status(404)
        .json(errorResponse("No enrolled students found in this section"));
    }

    // =========================
    // REQUIRED FIELDS CHECK
    // =========================
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

    // =========================
    // SAFE NORMALIZER
    // =========================
    const safe = (v) => (v ?? "").toString().trim();

    // =========================
    // BUILD STUDENT DATA
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

        // 🔥 FINAL FIX (ROBUST REMARK SOURCE)
        Remarks: e.remarks ? String(e.remarks).trim() : "",

        Section: safe(section.name),
        "Grade Level": `Grade ${section.gradeLevel}`,
        "IP Ethnic Group": safe(s.ethnicGroup),
      };
      console.log("[NODE REMARKS RAW]", e.remarks);
    });

    console.log(
      "[SF1 EXPORT REMARKS SAMPLE]",
      studentsData.slice(0, 5).map((s) => s.Remarks),
    );

    // =========================
    // VALIDATION
    // =========================
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

    // =========================
    // PYTHON GENERATION
    // =========================
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res
        .status(500)
        .json(errorResponse("SF1 template file not found on server"));
    }

    const outputPath = path.join(OUTPUT_DIR, `SF1_${section.id}_filled.xlsx`);

    let result;

    try {
      result = await runPythonWithJSON(PYTHON_EXE, PARSER_PATH, {
        students: studentsData,
        adviser: section.adviser,
        outputPath,
      });

      console.log("[SF1 Export] Python STDOUT:", result.stdout);
      console.log("[SF1 Export] Python STDERR:", result.stderr);
      console.log("ADVISER BEING SENT:", section.adviser);
    } catch (pyErr) {
      console.error("[SF1 Export] Python error:", pyErr.stderr || pyErr);
      return res
        .status(500)
        .json(errorResponse("Failed to generate SF1 Excel file", pyErr.stderr));
    }

    // =========================
    // FILE CHECK
    // =========================
    if (!fs.existsSync(outputPath)) {
      return res
        .status(500)
        .json(errorResponse("Excel file was not generated by Python"));
    }

    // =========================
    // STREAM FILE
    // =========================
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

// ?[GET] View SF1 data as JSON (for in-browser preview)
// GET /api/adviser/sf1/view
router.get("/view", verifyAdviser, async (req, res) => {
  try {
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error)
      return res.status(resolved.status).json(errorResponse(resolved.error));
    const { section } = resolved;

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: "ENROLLED" },
      include: { student: { include: { guardian: true, address: true } } },
      orderBy: { student: { lastName: "asc" } },
    });

    const students = enrollments.map((e) => {
      const g = s;
      return {
        LRN: s.lrn || "",
        "First Name": s.firstName || "",
        "Middle Name": s.middleName || "",
        "Last Name": s.lastName || "",
        Sex: s.sex || "",
        "Birth Date": s.birthDate || "",
        Age: calculateAge(s.birthDate),
        "Mother Tongue": s.motherTongue || "",
        Religion: s.religion || "",
        "Father Name": [g.fatherFirstName, g.fatherMiddleName, g.fatherLastName]
          .filter(Boolean)
          .join(" "),

        "Mother Maiden Name": [
          g.motherMaidenFirstName,
          g.motherMaidenMiddleName,
          g.motherMaidenLastName,
        ]
          .filter(Boolean)
          .join(" "),
        Barangay: s.barangay || s.address?.barangay || "",
        Municipality:
          s.municipality ||
          s.address?.municipalityCity ||
          s.address?.municipality ||
          "",
        Province: s.province || s.address?.province || "ILOILO",
        "Learning Modality": e.learningModality || "",
        Remarks: e.remarks || "",
      };
    });

    res.json(
      successResponse("SF1 data retrieved", {
        section: section.name,
        gradeLevel: section.gradeLevel,
        schoolYear: section.schoolYear,
        students,
      }),
    );
  } catch (err) {
    console.error("[SF1 View] Error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to retrieve SF1 data", err.message));
  }
});

// ? [GET] SF1 Remarks Debug Check
// /api/adviser/sf1/remarks-check
router.get("/remarks-check", verifyAdviser, async (req, res) => {
  try {
    // =========================
    // Resolve section
    // =========================
    const resolved = await resolveAdviserSection(req.adviserId);

    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const { section } = resolved;

    // =========================
    // Fetch enrollments with student
    // =========================
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: section.id,
      },
      include: {
        student: {
          include: {
            address: true,
            guardian: true,
          },
        },
      },
    });

    if (!enrollments.length) {
      return res.status(404).json(errorResponse("No enrollments found"));
    }

    // =========================
    // TRACE REPORT
    // =========================
    const report = enrollments.map((e) => {
      const s = e.student;

      const studentRemarks = s?.remarks ?? null; // (usually none in DB)
      const enrollmentRemarks = e?.remarks ?? null;

      return {
        lrn: s?.lrn,

        // 🔴 WHERE IT SHOULD BE
        enrollmentRemarks,

        // 🟡 FALLBACK SOURCE (if ever stored in student)
        studentRemarks,

        // 🟢 FINAL USED VALUE (what export should use)
        resolvedRemarks: enrollmentRemarks || studentRemarks || "",

        // 🔍 DEBUG FLAG
        hasRemarksInEnrollment: !!enrollmentRemarks,
        hasRemarksInStudent: !!studentRemarks,
      };
    });

    // =========================
    // SUMMARY
    // =========================
    const summary = {
      total: report.length,
      withEnrollmentRemarks: report.filter((r) => r.hasRemarksInEnrollment)
        .length,
      withStudentRemarks: report.filter((r) => r.hasRemarksInStudent).length,
      missingBoth: report.filter(
        (r) => !r.hasRemarksInEnrollment && !r.hasRemarksInStudent,
      ).length,
    };

    return res.json(
      successResponse("SF1 remarks diagnostic complete", {
        section: {
          id: section.id,
          name: section.name,
        },
        summary,
        report,
      }),
    );
  } catch (err) {
    console.error("[SF1 Remarks Check] Error:", err);
    return res
      .status(500)
      .json(errorResponse("Failed to check remarks", err.message));
  }
});

module.exports = router;
