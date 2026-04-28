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

// ? [POST] Import SF1 file → parse students → upsert → enroll → create SF9
// /api/adviser/sf1/import
router.post(
  "/import",
  verifyAdviser,
  upload.single("sf1File"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json(errorResponse("No file uploaded"));
    }

    console.log("[SF1 IMPORT HIT]", req.adviserId);

    const fs = require("fs");
    const path = require("path");

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

    let students;
    try {
      students = JSON.parse(result.stdout);
    } catch {
      return res.status(500).json(errorResponse("Invalid parser output"));
    }

    console.log("SAMPLE STUDENT:", students[0]);

    if (!students.length) {
      return res.status(400).json(errorResponse("No students found"));
    }

    // =========================
    // SECTION RESOLUTION
    // =========================
    const resolved = await resolveAdviserSection(req.adviserId);
    if (resolved.error) {
      return res.status(resolved.status).json(errorResponse(resolved.error));
    }

    const section = await prisma.section.findUnique({
      where: { id: resolved.section.id },
    });

    const { SPECIAL_SECTIONS } = require("../../utils/constants");

    const hasCurriculum = (gradeLevel, curriculum) => {
      if (curriculum === "Regular") return true;
      return SPECIAL_SECTIONS?.[gradeLevel]?.[curriculum]?.length > 0;
    };

    // =========================
    // SUBJECTS SETUP
    // =========================
    const coreSubjects = [
      "Filipino",
      "English",
      "Mathematics",
      "Science",
      "Araling Panlipunan",
      "Edukasyon sa Pagpapakatao",
      "MAPEH",
      "Edukasyong Pantahanan at Pangkabuhayan",
    ];

    const steSpecializedSubjects = {
      7: ["Environmental Science", "Research I"],
      8: ["Biotechnology", "Research II"],
      9: ["Applied Chemistry", "Research III"],
      10: ["Electronics", "Research IV"],
    };

    const curriculumAddons = {
      SPJ: ["ICT", "Journalism"],
      SPS: ["Badminton"],
      SPA: ["Visual Arts"],
    };

    const { gradeLevel, curriculum } = section;

    let subjects = [];

    if (hasCurriculum(gradeLevel, curriculum)) {
      if (curriculum === "Regular") {
        subjects = coreSubjects;
      } else if (curriculum === "STE") {
        subjects = [
          ...coreSubjects,
          ...(steSpecializedSubjects[gradeLevel] || []),
        ];
      } else {
        subjects = [...coreSubjects, ...(curriculumAddons[curriculum] || [])];
      }
    }

    // =========================
    // LEARNING AREA MATCHING
    // =========================
    const learningAreas = await prisma.learningArea.findMany({
      where: {
        gradeLevel: Number(gradeLevel),
        curriculum,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const normalize = (str) => str.toLowerCase().trim();
    const subjectSet = new Set(subjects.map(normalize));

    const subjectIds = learningAreas
      .filter((la) => subjectSet.has(normalize(la.name)))
      .map((la) => la.id);

    console.log({
      gradeLevel,
      curriculum,
      subjects,
      learningAreasCount: learningAreas.length,
      matchedSubjectIds: subjectIds.length,
    });

    // =========================
    // RESULTS TRACKING
    // =========================
    const results = {
      created: 0,
      updated: 0,
      enrolled: 0,
      skippedEnrollment: 0,
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
        let studentId;

        const existing = await prisma.student.findUnique({
          where: { lrn: s.lrn },
        });

        if (!existing) {
          const created = await prisma.student.create({
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
            },
          });

          studentId = created.id;
          results.created++;
        } else {
          await prisma.student.update({
            where: { lrn: s.lrn },
            data: {
              firstName: s.firstName,
              middleName: s.middleName || null,
              lastName: s.lastName,
            },
          });

          studentId = existing.id;
          results.updated++;
        }

        // =========================
        // ENROLLMENT
        // =========================
        const enrolled = await prisma.enrollment.findFirst({
          where: {
            studentId,
            sectionId: section.id,
          },
        });

        if (!enrolled) {
          await prisma.enrollment.create({
            data: {
              studentId,
              sectionId: section.id,
              schoolYear: section.schoolYear,
              learningModality: s.learningModality || "FACE_TO_FACE",
              status: "ENROLLED",
            },
          });

          results.enrolled++;
        } else {
          results.skippedEnrollment++;
        }

        // =========================
        // SF9 CREATION (FIXED LOGIC)
        // =========================

        if (subjectIds.length > 0) {
          const existingSF9 = await prisma.sF9Grade.findMany({
            where: {
              studentId,
              schoolYear: section.schoolYear,
              learningAreaId: {
                in: subjectIds,
              },
            },
            select: {
              learningAreaId: true,
            },
          });

          const existingSet = new Set(existingSF9.map((g) => g.learningAreaId));

          const toCreate = subjectIds.filter((id) => !existingSet.has(id));

          if (toCreate.length > 0) {
            await prisma.sF9Grade.createMany({
              data: toCreate.map((id) => ({
                studentId,
                learningAreaId: id,
                schoolYear: section.schoolYear,
                q1: null,
                q2: null,
                q3: null,
                q4: null,
                q1Ready: false,
                q2Ready: false,
                q3Ready: false,
                q4Ready: false,
              })),
            });

            results.sf9Created++;
          }
        }
      } catch (err) {
        results.errors.push({
          lrn: s.lrn,
          reason: err.message,
        });
      }
    }

    return res.json(
      successResponse("Import complete", {
        section,
        results,
      }),
    );
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
        g = s.guardian || {};
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
        Barangay: s.barangay || "",
        Municipality: s.municipality || "",
        Province: s.province || "",
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
      console.warn("[SF1 Export] Incomplete students detected:", incomplete);
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

module.exports = router;
