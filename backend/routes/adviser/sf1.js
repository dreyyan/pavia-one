// [IMPORT] Setup
const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { generateSF1PDFBuffer } = require('../../services/sf1Service'); // PDF buffer generator

// [IMPORT] Middleware & Utils
const { errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;

// ?[GET] Generate SF1 PDF for adviser's advisory section
// /api/adviser/sf1?sectionId=14
router.get('/', verifyAdviser, async (req, res) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) return res.status(400).json(errorResponse('Missing sectionId'));

    // --- Verify adviser exists ---
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });
    if (!adviser) return res.status(404).json(errorResponse('Adviser not found'));

    // --- Verify section belongs to adviser ---
    const section = await prisma.section.findFirst({
      where: { id: Number(sectionId), adviserId: adviser.id },
      select: { id: true, name: true, gradeLevel: true },
    });
    if (!section) return res.status(404).json(errorResponse('Section not found or not owned by you'));

    // --- Fetch enrolled students ---
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ENROLLED' },
      include: { student: true },
      orderBy: { student: { lastName: 'asc' } },
    });
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json(errorResponse('No students found in your advisory section SF1'));
    }

    // --- Map students to PDF-ready format ---
    const studentsData = enrollments.map(e => ({
      lrn: e.student.lrn,
      name: `${e.student.lastName}, ${e.student.firstName}, ${e.student.middleName || ''}`,
      sex: e.student.sex || '',
      birth: e.student.birthDate || '',
      age: e.student.age || '',
      mother_tongue: e.student.motherTongue || '',
      religion: e.student.religion || '',
      barangay: e.student.barangay || '',
      municipality: e.student.municipality || '',
      province: e.student.province || '',
      father_name: e.student.fatherName || '',
      mother_maiden_name: e.student.motherMaidenName || '',
      learning_modality: e.student.learningModality || '',
      remarks: e.student.remarks || '',
      section: section.name,
    }));

    // --- Generate PDF buffer ---
    const pdfBuffer = await generateSF1PDFBuffer(section, studentsData); // already returns Buffer

    // --- Send PDF as download ---
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=SF1_${section.name}_Grade${section.gradeLevel}.pdf`
    );
    res.send(pdfBuffer);

  } catch (err) {
    console.error('SF1 PDF generation error:', err);
    res.status(500).json(errorResponse('Failed to generate SF1 PDF', err.message));
  }
});

module.exports = router;