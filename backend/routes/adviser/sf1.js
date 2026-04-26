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

// ? [POST] Import SF1 file → parse students → upsert to DB → enroll in section
// /api/adviser/sf1/import
router.post(
  "/import",
  verifyAdviser,
  upload.single("sf1File"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json(errorResponse("No file uploaded"));
    }

    const filePath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();

    // [VALIDATION] File type
    if (![".xlsx", ".csv"].includes(originalExt)) {
      safeUnlink(filePath);
      return res
        .status(400)
        .json(
          errorResponse(
            "Invalid file type. Only .xlsx or .csv files are accepted.",
          ),
        );
    }

    // Rename temp file to have the correct extension so Python can detect it
    const namedPath = filePath + originalExt;
    try {
      fs.renameSync(filePath, namedPath);
    } catch (_) {
      safeUnlink(filePath);
      return res
        .status(500)
        .json(errorResponse("Failed to process uploaded file"));
    }

    let result;
    try {
      // [1] Run python importer
      try {
        result = await runPythonWithFile(PYTHON_EXE, IMPORTER_PATH, namedPath);
      } catch (pyErr) {
        console.error("[SF1 Import] FULL ERROR:", pyErr);
        return res
          .status(500)
          .json(
            errorResponse(
              "Python importer failed",
              pyErr.stderr || pyErr.stdout || pyErr,
            ),
          );
      } finally {
        safeUnlink(namedPath);
      }

      // [2] Parse JSON output
      let students;
      try {
        students = JSON.parse(result.stdout);
      } catch (_) {
        return res
          .status(500)
          .json(errorResponse("Parser returned invalid data"));
      }

      if (!students.length) {
        return res
          .status(400)
          .json(errorResponse("No student records found in the uploaded file"));
      }

      // [3] Resolve adviser + section
      const resolved = await resolveAdviserSection(req.adviserId);
      if (resolved.error) {
        return res.status(resolved.status).json(errorResponse(resolved.error));
      }
      const { adviser, section } = resolved;

      // [4] Upsert students + address + guardian
      const results = {
        created: 0,
        updated: 0,
        enrolled: 0,
        skippedEnrollment: 0,
        errors: [],
      };

      for (const s of students) {
        if (!s.lrn || !s.firstName || !s.lastName) {
          results.errors.push({
            lrn: s.lrn || "?",
            reason: "Missing required fields (LRN / First Name / Last Name)",
          });
          continue;
        }

        try {
          // Upsert student
          const existing = await prisma.student.findUnique({
            where: { lrn: s.lrn },
          });

          if (!existing) {
            await prisma.student.create({
              data: {
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
                // Address
                ...(s.barangay || s.municipality || s.province
                  ? {
                      address: {
                        create: {
                          barangay: s.barangay || null,
                          municipalityCity: s.municipality || null,
                          province: s.province || null,
                        },
                      },
                    }
                  : {}),
                // Guardian
                ...(s.fatherFirstName || s.motherMaidenFirstName
                  ? {
                      guardian: {
                        create: {
                          fatherFirstName: s.fatherFirstName || null,
                          fatherMiddleName: s.fatherMiddleName || null,
                          fatherLastName: s.fatherLastName || null,
                          motherMaidenFirstName:
                            s.motherMaidenFirstName || null,
                          motherMaidenMiddleName:
                            s.motherMaidenMiddleName || null,
                          motherMaidenLastName: s.motherMaidenLastName || null,
                        },
                      },
                    }
                  : {}),
              },
            });
            results.created++;
          } else {
            // Update core fields only
            await prisma.student.update({
              where: { lrn: s.lrn },
              data: {
                firstName: s.firstName,
                middleName: s.middleName || null,
                lastName: s.lastName,
                sex: s.sex || existing.sex,
                birthDate: s.birthDate
                  ? new Date(s.birthDate)
                  : existing.birthDate,
                motherTongue: s.motherTongue || existing.motherTongue,
                ethnicGroup: s.ethnicGroup || existing.ethnicGroup,
                religion: s.religion || existing.religion,
              },
            });
            results.updated++;
          }

          // [5] Enroll student in adviser's section
          const student = await prisma.student.findUnique({
            where: { lrn: s.lrn },
            select: { id: true },
          });

          const alreadyEnrolled = await prisma.enrollment.findFirst({
            where: { studentId: student.id, sectionId: section.id },
          });

          if (!alreadyEnrolled) {
            await prisma.enrollment.create({
              data: {
                studentId: student.id,
                sectionId: section.id,
                schoolYear: section.schoolYear,
                learningModality: s.learningModality || "FACE_TO_FACE",
                status: "ENROLLED",
                remarks: s.remarks || null,
              },
            });
            results.enrolled++;
          } else {
            results.skippedEnrollment++;
          }
        } catch (err) {
          console.error(`[SF1 Import] Student ${s.lrn} error:`, err.message);
          results.errors.push({ lrn: s.lrn, reason: err.message });
        }
      }

      return res.status(200).json(
        successResponse(
          `Import complete. ${results.created} new student(s) created, ${results.updated} updated, ${results.enrolled} enrolled.`,
          {
            section: {
              id: section.id,
              name: section.name,
              gradeLevel: section.gradeLevel,
            },
            results,
          },
        ),
      );
    } catch (err) {
      safeUnlink(namedPath);
      console.error("[SF1 Import] Unexpected error:", err);
      return res
        .status(500)
        .json(errorResponse("Import failed unexpectedly", err.message));
    }
  },
);

// ? [GET] Export SF1 — build Excel from DB data and stream it
// /api/adviser/sf1/export
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
      where: { sectionId: section.id, status: "ENROLLED" },
      include: { student: { include: { guardian: true, address: true } } },
      orderBy: { student: { lastName: "asc" } },
    });

    if (!enrollments.length) {
      return res
        .status(404)
        .json(errorResponse("No enrolled students found in this section"));
    }

    // [3] Validate completeness
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

    const studentsData = enrollments.map((e) => {
      const s = e.student,
        g = s.guardian || {},
        a = s.address || {};
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
        Barangay: a.barangay || "",
        Municipality: a.municipalityCity || "",
        Province: a.province || "",
        "Learning Modality": e.learningModality || "",
        Remarks: e.remarks || "",
        Section: section.name || "",
        "Grade Level": `Grade ${section.gradeLevel}`,
        "IP Ethnic Group": s.ethnicGroup || "",
      };
    });

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
      return res.status(400).json({
        success: false,
        message:
          "Cannot export SF1: some students have incomplete information.",
        data: incomplete,
      });
    }

    // [4] Run Python parser to fill the template
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res
        .status(500)
        .json(errorResponse("SF1 template file not found on server"));
    }

    // Use a unique output path per section to avoid race conditions
    const outputPath = path.join(OUTPUT_DIR, `SF1_${section.id}_filled.xlsx`);

    // Patch parser to use our per-section output path via env var
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

    const finalPath = outputPath;

    if (!finalPath) {
      console.error("[SF1 Export] No output file found in:", OUTPUT_DIR);
      return res
        .status(500)
        .json(errorResponse("Excel file was not generated by Python"));
    }

    // [5] Stream file
    const filename = `SF1_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(/\s/g, "")}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const stream = fs.createReadStream(finalPath);
    stream.pipe(res);
    stream.on("end", () => {
      safeUnlink(finalPath);
    });
    stream.on("error", (err) => {
      console.error("[SF1 Export] Stream error:", err);
      if (!res.headersSent)
        res.status(500).json(errorResponse("Failed to stream Excel file"));
      else res.destroy();
    });
  } catch (err) {
    console.error("[SF1 Export] Unexpected error:", err);
    if (!res.headersSent)
      res.status(500).json(errorResponse("Export failed", err.message));
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
      const s = e.student,
        g = s.guardian || {},
        a = s.address || {};
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
        Barangay: a.barangay || "",
        Municipality: a.municipalityCity || "",
        Province: a.province || "",
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

module.exports = router;
