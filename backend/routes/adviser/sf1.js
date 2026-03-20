const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// -------------------- PATHS --------------------
const SERVICES_DIR = path.resolve(__dirname, '../../services'); // Python scripts
const FORMS_DIR = path.resolve(__dirname, '../../forms');       // Templates & JSON
const OUTPUT_DIR = path.join(FORMS_DIR, 'output_data');

const XLSX_PARSER_PATH = path.join(SERVICES_DIR, 'xlsx_parser.py');
const FILL_SF1_PATH = path.join(SERVICES_DIR, 'fill_sf1_template.py');
const RAW_JSON_PATH = path.join(FORMS_DIR, 'raw_students.json');
const FINAL_XLSX_PATH = path.join(FORMS_DIR, 'SF1_filled_output.xlsx');
const PYTHON_EXE = path.join(__dirname, '../../venv/Scripts/python.exe'); // venv Python

// -------------------- HELPER --------------------
async function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running Python: ${PYTHON_EXE} ${scriptPath} ${args.join(' ')}`);
    execFile(PYTHON_EXE, [scriptPath, ...args], { cwd: path.dirname(scriptPath) }, (error, stdout, stderr) => {
      console.log('--- PYTHON STDOUT ---\n', stdout);
      console.log('--- PYTHON STDERR ---\n', stderr);

      if (error) {
        return reject({ error, stdout, stderr });
      }
      resolve({ stdout, stderr });
    });
  });
}

// -------------------- ENDPOINT --------------------
router.get('/', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) return res.status(400).json(errorResponse('Missing sectionId'));

    // --- Verify adviser ---
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });
    if (!adviser) return res.status(404).json(errorResponse('Adviser not found'));

    // --- Verify section ---
    const section = await prisma.section.findFirst({
      where: { id: Number(sectionId), adviserId: adviser.id },
      select: { id: true, name: true, gradeLevel: true },
    });
    if (!section) return res.status(404).json(errorResponse('Section not found or not owned by you'));

    // --- Fetch enrolled students with guardian and address ---
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ENROLLED' },
      include: {
        student: {
          include: { guardian: true, address: true }, // include address here
        },
      },
      orderBy: { student: { lastName: 'asc' } },
    });

    if (!enrollments || enrollments.length === 0)
      return res.status(404).json(errorResponse('No students found in your advisory section SF1'));

// --- Map students to complete JSON ---
const studentsData = enrollments.map(e => {
  const student = e.student;
  const guardian = student.guardian || {};
  const address = student.address || {};

  const fatherName = [guardian.fatherFirstName, guardian.fatherMiddleName, guardian.fatherLastName].filter(Boolean).join(' ');
  const motherMaidenName = [guardian.motherMaidenFirstName, guardian.motherMaidenMiddleName, guardian.motherMaidenLastName].filter(Boolean).join(' ');

  return {
    lrn: student.lrn || '',
    firstName: student.firstName || '',
    middleName: student.middleName || '',
    lastName: student.lastName || '',
    nameExtension: student.nameExtension || null,
    sex: student.sex || '',
    birthDate: student.birthDate || '',
    motherTongue: student.motherTongue || '',
    ethnicGroup: student.ethnicGroup || '',
    religion: student.religion || '',
    email: student.email || '',
    password: student.password || '',
    createdByAdviserId: student.createdByAdviserId || '',

    fatherName,
    motherMaidenName,

    streetAddress: address.streetAddress || '',        // <-- added streetAddress
    barangay: address.barangay || '',
    municipality: address.municipalityCity || '',
    province: address.province || '',

    learningModality: e.learningModality || '',
    remarks: e.remarks || '',
  };
});

    // --- Write raw JSON ---
    fs.writeFileSync(RAW_JSON_PATH, JSON.stringify(studentsData, null, 2), 'utf-8');
    console.log(`[INFO] raw_students.json generated with ${studentsData.length} students.`);

    // --- Run Python scripts ---
    const parserResult = await runPythonScript(XLSX_PARSER_PATH, [RAW_JSON_PATH]);
    console.log('xlsx_parser.py completed:', parserResult);

    const fillResult = await runPythonScript(FILL_SF1_PATH);
    console.log('fill_sf1_template.py completed:', fillResult);

    // --- Check Excel output ---
    if (!fs.existsSync(FINAL_XLSX_PATH)) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate SF1 Excel',
        data: { parserResult, fillResult },
      });
    }

    // --- Send Excel file ---
    res.download(FINAL_XLSX_PATH, `SF1_${section.name}_Grade${section.gradeLevel}.xlsx`);
  } catch (err) {
    console.error('SF1 Excel generation error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SF1 Excel',
      data: err,
    });
  }
});

module.exports = router;