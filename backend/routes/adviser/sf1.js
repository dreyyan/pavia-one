const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { successResponse, errorResponse } = require('../../utils/response');
const verifyAdviser = require('../../middleware/authMiddleware').verifyAdviser;
const { calculateAge } = require('../../utils/helpers');

// ?[GET] Generate SF1 school register for adviser's section
// /api/adviser/sf1
router.get('/', verifyAdviser, async (req, res) => {
  try {
    const adviserId = req.adviserId;

    // [1] Fetch the section managed by the adviser
    const section = await prisma.section.findFirst({
      where: { adviserId },
      include: {
        enrollments: {
          where: { status: 'ENROLLED' },
          include: {
            student: {
              include: {
                address: true,
                guardian: true
              }
            }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json(errorResponse('You do not manage any section to generate SF1'));
    }

    // [2] Fetch the single school
    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(404).json(errorResponse('School information not found. Please create a school record first.'));
    }

    // [3] Prepare SF1 data
    const sf1Data = {
      schoolId: school.schoolIdNumber,
      region: school.region,
      division: school.division,
      schoolName: school.schoolName,
      schoolYear: section.schoolYear,
      gradeLevel: section.gradeLevel,
      sectionName: section.name,
      students: section.enrollments.map(e => {
        const s = e.student;
        return {
          lrn: s.lrn,
          name: [s.lastName, s.firstName, s.middleName].filter(Boolean).join(', '),
          sex: s.sex,
          birthDate: s.birthDate,
          age: calculateAge(s.birthDate),
          motherTongue: s.motherTongue || null,
          ethnicGroup: s.ethnicGroup || null,
          religion: s.religion || null,
          streetAddress: s.address?.streetAddress || null,
          barangay: s.address?.barangay || null,
          municipalityCity: s.address?.municipalityCity || null,
          province: s.address?.province || null,
          fatherName: s.guardian
            ? [s.guardian.fatherLastName, s.guardian.fatherFirstName, s.guardian.fatherMiddleName].filter(Boolean).join(' ')
            : null,
          motherMaidenName: s.guardian
            ? [s.guardian.motherMaidenLastName, s.guardian.motherMaidenFirstName, s.guardian.motherMaidenMiddleName].filter(Boolean).join(' ')
            : null,
          guardianName: s.guardian?.guardianName || null,
          guardianRelationship: s.guardian?.guardianRelationship || null,
          guardianContactNumber: s.guardian?.guardianContactNumber || null,
          learningModality: e.learningModality,
          remarks: e.remarks || null
        };
      })
    };

    res.json(successResponse('SF1 School Register retrieved successfully', sf1Data));

  } catch (err) {
    console.error('SF1 fetch error:', err);
    res.status(500).json(errorResponse('Failed to fetch SF1 School Register', err.message));
  }
});

module.exports = router;