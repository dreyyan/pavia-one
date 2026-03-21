// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// [SETUP] Paths
const SERVICES_DIR = path.resolve(__dirname, '../../services');
const FORMS_DIR = path.resolve(__dirname, '../../forms');
const OUTPUT_DIR = path.join(FORMS_DIR, 'output_data');
const FINAL_XLSX_PATH = path.join(OUTPUT_DIR, 'SF1_filled_output.xlsx');
const PYTHON_EXE = path.join(__dirname, '../../venv/Scripts/python.exe');
const XLSX_PARSER_PATH = path.join(SERVICES_DIR, 'xlsx_parser.py');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// [HELPER] Run Python script with JSON data via stdin
function runPythonWithJSON(scriptPath, jsonData) {
  return new Promise((resolve, reject) => {
    const pyProcess = spawn(PYTHON_EXE, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', data => { stdout += data.toString(); });
    pyProcess.stderr.on('data', data => { stderr += data.toString(); });

    pyProcess.on('close', code => {
      if (code !== 0) return reject({ code, stdout, stderr });
      resolve({ stdout, stderr });
    });

    pyProcess.stdin.write(JSON.stringify(jsonData));
    pyProcess.stdin.end();
  });
}

// --- Helper: calculate age from birthDate ---
function calculateAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--; // hasn't had birthday yet this year
  }
  return age;
}

// ?[GET] Get School Register (SF1) and stream Excel safely
// api/advisers/sf1
router.get('/', verifyAdviser, async (req, res) => {
  console.log('SF1 route called:', new Date().toISOString());

  try {
    // --- Adviser ---
    const adviser = await prisma.adviser.findUnique({ 
      where: { adviserId: req.adviserId }, 
      select: { id: true } 
    });
    if (!adviser) return res.status(404).json(errorResponse('Adviser not found'));

    // --- Section ---
    const section = await prisma.section.findFirst({
      where: { adviserId: adviser.id },
      select: { id: true, name: true, gradeLevel: true }
    });
    if (!section) return res.status(404).json(errorResponse('No advisory section assigned'));

    // --- Enrollments ---
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ENROLLED' },
      include: { student: { include: { guardian: true, address: true } } },
      orderBy: { student: { lastName: 'asc' } }
    });
    if (!enrollments.length) return res.status(404).json(errorResponse('No students found'));

    // REQUIRED FIELDS for SF1 generation
    const REQUIRED_FIELDS = [
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
      "Learning Modality"
    ];

    // --- Prepare JSON data for Python ---
    const studentsData = enrollments.map(e => {
      const s = e.student, g = s.guardian || {}, a = s.address || {};
      return {
        LRN: s.lrn || '',
        "First Name": s.firstName || '',
        "Middle Name": s.middleName || '',
        "Last Name": s.lastName || '',
        Sex: s.sex || '',
        "Birth Date": s.birthDate || '',
        Age: calculateAge(s.birthDate),
        "Mother Tongue": s.motherTongue || '',
        Religion: s.religion || '',
        "Father Name": [g.fatherFirstName,g.fatherMiddleName,g.fatherLastName].filter(Boolean).join(' '),
        "Mother Maiden Name": [g.motherMaidenFirstName,g.motherMaidenMiddleName,g.motherMaidenLastName].filter(Boolean).join(' '),
        Barangay: a.barangay || '',
        Municipality: a.municipalityCity || '',
        Province: a.province || '',
        "Learning Modality": e.learningModality || '',
        Remarks: e.remarks || '',
        Section: section.name || '',
        "Grade Level": section.gradeLevel || ''
      };
    });

    // --- Validate student data completeness ---
    const incompleteStudents = studentsData.map((s, i) => {
      const missingFields = REQUIRED_FIELDS.filter(f => !s[f] || s[f].toString().trim() === "");
      if (missingFields.length) return { index: i + 1, name: `${s["Last Name"]}, ${s["First Name"]}`, missingFields };
      return null;
    }).filter(Boolean);

    if (incompleteStudents.length) {
      return res.status(400).json({
        success: false,
        message: "Cannot generate SF1: some students have incomplete information",
        data: incompleteStudents
      });
    }

    // --- Run Python script ---
    try {
      await runPythonWithJSON(XLSX_PARSER_PATH, studentsData);
    } catch (pyErr) {
      console.error('Python script failed:', pyErr);
      return res.status(500).json({ success: false, message: 'Python script failed', data: pyErr });
    }

    // --- Check XLSX output ---
    if (!fs.existsSync(FINAL_XLSX_PATH)) {
      return res.status(500).json({ success: false, message: 'Excel file missing' });
    }

    // --- Stream file ---
    res.setHeader('Content-Disposition', `attachment; filename=SF1_${section.name}_Grade${section.gradeLevel}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const fileStream = fs.createReadStream(FINAL_XLSX_PATH);
    fileStream.pipe(res);
    fileStream.on('error', err => {
      console.error('File stream error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to read Excel', data: err });
      else res.destroy();
    });

  } catch (err) {
    console.error('SF1 export error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to export SF1', data: err });
  }
});

// ?[GET] View SF1
// GET /api/advisers/sf1/:sectionId/sf1/view
router.get('/:sectionId/sf1/view', verifyAdviser, async (req, res) => {
  const { sectionId } = req.params;

  try {
    const section = await prisma.section.findUnique({ where: { id: Number(sectionId) } });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ENROLLED' },
      include: { student: { include: { guardian: true, address: true } } },
      orderBy: { student: { lastName: 'asc' } }
    });

    const studentsData = enrollments.map(e => {
      const s = e.student, g = s.guardian || {}, a = s.address || {};
      return {
        LRN: s.lrn || '',
        "First Name": s.firstName || '',
        "Middle Name": s.middleName || '',
        "Last Name": s.lastName || '',
        Sex: s.sex || '',
        "Birth Date": s.birthDate || '',
        Age: s.birthDate ? new Date().getFullYear() - new Date(s.birthDate).getFullYear() : '',
        "Mother Tongue": s.motherTongue || '',
        Religion: s.religion || '',
        "Father Name": [g.fatherFirstName,g.fatherMiddleName,g.fatherLastName].filter(Boolean).join(' '),
        "Mother Maiden Name": [g.motherMaidenFirstName,g.motherMaidenMiddleName,g.motherMaidenLastName].filter(Boolean).join(' '),
        Barangay: a.barangay || '',
        Municipality: a.municipalityCity || '',
        Province: a.province || '',
        "Learning Modality": e.learningModality || '',
        Remarks: e.remarks || '',
      };
    });

    res.json({ success: true, section: section.name, gradeLevel: section.gradeLevel, students: studentsData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to get SF1 data', error: err });
  }
});

module.exports = router;