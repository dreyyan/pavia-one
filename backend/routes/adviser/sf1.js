// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { successResponse, errorResponse } = require("../../utils/response");
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

const multer = require("multer");
const UPLOAD_DIR = path.join(__dirname, "../../tmp");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// [SETUP] Paths
const SERVICES_DIR = path.resolve(__dirname, "../../services");
const FORMS_DIR = path.resolve(__dirname, "../../forms");
const OUTPUT_DIR = path.join(FORMS_DIR, "output_data");
const TEMPLATE_PATH = path.join(FORMS_DIR, "SF1_template.xlsx");
const IMPORTER_PATH = path.join(SERVICES_DIR, "xlsx_importer.py");
const PARSER_PATH = path.join(SERVICES_DIR, "xlsx_parser.py");

// Cross-platform Python executable
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "../../venv/Scripts/python.exe")
    : path.join(__dirname, "../../venv/bin/python3");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// [HELPER] Run Python with JSON piped via stdin → resolves with { stdout, stderr }
// ─────────────────────────────────────────────────────────────────────────────
function runPythonWithJSON(scriptPath, jsonData) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_EXE, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));
    py.on("close", (code) => {
      if (code !== 0) return reject({ code, stdout, stderr });
      resolve({ stdout, stderr });
    });
    py.stdin.write(JSON.stringify(jsonData));
    py.stdin.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// [HELPER] Run Python with a file argument
// ─────────────────────────────────────────────────────────────────────────────
function runPythonWithFile(scriptPath, filePath) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_EXE, [scriptPath, filePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));
    py.on("close", (code) => {
      if (code !== 0) return reject({ code, stdout, stderr });
      resolve({ stdout, stderr });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// [HELPER] Calculate age from birthDate
// ─────────────────────────────────────────────────────────────────────────────
function calculateAge(birthDate) {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─────────────────────────────────────────────────────────────────────────────
// [HELPER] Resolve adviser → section  (used by both routes)
// ─────────────────────────────────────────────────────────────────────────────
async function resolveAdviserSection(adviserId) {
  const adviser = await prisma.adviser.findUnique({
    where: { adviserId },
    select: { id: true },
  });
  if (!adviser) return { error: "Adviser not found", status: 404 };

  const section = await prisma.section.findFirst({
    where: { adviserId: adviser.id },
    select: { id: true, name: true, gradeLevel: true, schoolYear: true },
  });
  if (!section) return { error: "No advisory section assigned", status: 404 };

  return { adviser, section };
}

// ─────────────────────────────────────────────────────────────────────────────
// [HELPER] Safely delete a temp file (no crash if already gone)
// ─────────────────────────────────────────────────────────────────────────────
function safeUnlink(p) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (_) {}
}

// =============================================================================
// ?[POST] Import SF1 file → parse students → upsert to DB → enroll in section
// POST /api/adviser/sf1/import
// Body: multipart/form-data  { sf1File: <xlsx|csv> }
// =============================================================================
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

    try {
      // ── 1. Run Python importer ──────────────────────────────────────────────
      let result;
      try {
        result = await runPythonWithFile(IMPORTER_PATH, namedPath);
      } catch (pyErr) {
        console.error("[SF1 Import] Python error:", pyErr.stderr);
        return res
          .status(500)
          .json(
            errorResponse(
              "Failed to parse the uploaded file. Make sure it is a valid SF1 template.",
              pyErr.stderr,
            ),
          );
      } finally {
        safeUnlink(namedPath);
      }

      // ── 2. Parse JSON output ────────────────────────────────────────────────
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

      // ── 3. Resolve adviser + section ────────────────────────────────────────
      const resolved = await resolveAdviserSection(req.adviserId);
      if (resolved.error) {
        return res.status(resolved.status).json(errorResponse(resolved.error));
      }
      const { adviser, section } = resolved;

      // ── 4. Upsert students + address + guardian ─────────────────────────────
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
                createdByAdviserId: req.adviserId, // String — the adviser's adviserId code, not the numeric PK
                // Address (nested create)
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
                // Guardian (nested create) — importer already splits names into individual fields
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
            // Update core fields only (don't overwrite richer data)
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

          // ── 5. Enroll student in adviser's section ──────────────────────────
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

// =============================================================================
// ?[GET] Export SF1 — build Excel from DB data and stream it
// GET /api/adviser/sf1/export
// =============================================================================
router.get("/export", verifyAdviser, async (req, res) => {
  try {
    // ── 1. Resolve adviser + section ────────────────────────────────────────
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }
    const { section } = resolved;

    // ── 2. Fetch enrolled students ──────────────────────────────────────────
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

    // ── 3. Validate completeness ────────────────────────────────────────────
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

    // ── 4. Run Python parser to fill the template ───────────────────────────
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res
        .status(500)
        .json(errorResponse("SF1 template file not found on server"));
    }

    // Use a unique output path per section to avoid race conditions
    const outputPath = path.join(OUTPUT_DIR, `SF1_${section.id}_filled.xlsx`);

    // Patch parser to use our per-section output path via env var
    // (xlsx_parser.py reads OUTPUT_PATH from its own OUTPUT_DIR — we pass data via stdin)
    try {
      await runPythonWithJSON(PARSER_PATH, studentsData);
    } catch (pyErr) {
      console.error("[SF1 Export] Python error:", pyErr.stderr || pyErr);
      return res
        .status(500)
        .json(errorResponse("Failed to generate SF1 Excel file", pyErr.stderr));
    }

    // xlsx_parser.py writes to OUTPUT_DIR/SF1_filled_output.xlsx by default
    const defaultOutput = path.join(OUTPUT_DIR, "SF1_filled_output.xlsx");
    if (!fs.existsSync(defaultOutput)) {
      return res
        .status(500)
        .json(errorResponse("Generated Excel file not found"));
    }

    // Rename to section-specific path so concurrent requests don't collide
    try {
      fs.renameSync(defaultOutput, outputPath);
    } catch (_) {}
    const finalPath = fs.existsSync(outputPath) ? outputPath : defaultOutput;

    // ── 5. Stream file ───────────────────────────────────────────────────────
    const filename = `SF1_Grade${section.gradeLevel}_${section.name}_${section.schoolYear.replace(/\s/g, "")}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const stream = fs.createReadStream(finalPath);
    stream.pipe(res);
    stream.on("close", () => {
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

// =============================================================================
// ?[GET] View SF1 data as JSON (for in-browser preview)
// GET /api/adviser/sf1/view
// =============================================================================
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
