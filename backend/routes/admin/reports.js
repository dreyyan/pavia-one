// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Middleware
const { verifyAdmin } = require("../../middleware/authMiddleware");

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");
const { SchoolFormStatus } = require("@prisma/client");

// routes/admin/reports.js
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Admin profile
    const adminProfile = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });

    // Key metrics
    const totalStudents = await prisma.student.count();
    const totalAdvisers = await prisma.adviser.count();
    const totalSections = await prisma.section.count();
    const totalFormsPending = await prisma.schoolForm.count({
      where: { status: SchoolFormStatus.DRAFT },
    });

    // Students by Grade
    const sectionsWithEnrollments = await prisma.section.findMany({
      select: {
        gradeLevel: true,
        enrollments: { select: { id: true } },
      },
    });

    const studentsByGradeMap = {};
    sectionsWithEnrollments.forEach((section) => {
      studentsByGradeMap[section.gradeLevel] =
        (studentsByGradeMap[section.gradeLevel] || 0) +
        section.enrollments.length;
    });

    const studentsByGrade = Object.entries(studentsByGradeMap).map(
      ([gradeLevel, count]) => ({ gradeLevel: parseInt(gradeLevel), count }),
    );

    // Safety check
    if (!prisma.enrollment) {
      console.error("Prisma model 'Enrollment' is undefined");
      process.exit(1); // optional: stop server so you notice the error
    }

    // Students by Modality
    const enrollments = await prisma.enrollment.findMany({
      select: { learningModality: true },
    });

    const modalityMap = {};
    enrollments.forEach((e) => {
      modalityMap[e.learningModality] =
        (modalityMap[e.learningModality] || 0) + 1;
    });

    const studentsByModality = Object.entries(modalityMap).map(
      ([modality, count]) => ({
        modality,
        count,
      }),
    );

    // Sections per Adviser
    const sectionsPerAdviserRaw = await prisma.section.groupBy({
      by: ["adviserId"],
      _count: { id: true },
    });

    const sectionsPerAdviser = await Promise.all(
      sectionsPerAdviserRaw.map(async (s) => {
        const adviser = await prisma.adviser.findUnique({
          where: { id: s.adviserId },
          select: { name: true },
        });
        return {
          adviserName: adviser ? adviser.name : "Unknown",
          sections: s._count.id,
        };
      }),
    );

    // Average Grades per Grade Level
    const sf9Grades = await prisma.sF9Grade.findMany({
      select: { finalRating: true, studentId: true },
    });

    // Build studentId -> gradeLevel map
    const enrollmentsForGrades = await prisma.enrollment.findMany({
      select: { studentId: true, section: { select: { gradeLevel: true } } },
    });

    const studentGradeMap = {};
    enrollmentsForGrades.forEach((enroll) => {
      if (enroll.section)
        studentGradeMap[enroll.studentId] = enroll.section.gradeLevel;
    });

    // Aggregate averages
    const gradeSumCount = {};
    sf9Grades.forEach((grade) => {
      const gradeLevel = studentGradeMap[grade.studentId];
      if (gradeLevel && grade.finalRating != null) {
        if (!gradeSumCount[gradeLevel])
          gradeSumCount[gradeLevel] = { sum: 0, count: 0 };
        gradeSumCount[gradeLevel].sum += grade.finalRating;
        gradeSumCount[gradeLevel].count += 1;
      }
    });

    const averageGradesPerGrade = Object.entries(gradeSumCount).map(
      ([gradeLevel, { sum, count }]) => ({
        gradeLevel: parseInt(gradeLevel),
        average: count > 0 ? sum / count : 0,
      }),
    );

    // Failing students
    const failingStudentsCount = await prisma.sF9Grade.count({
      where: { finalRating: { lt: 75 } },
    });

    res.json(
      successResponse("Reports retrieved successfully", {
        adminProfile,
        data: {
          totalStudents,
          totalAdvisers,
          totalSections,
          totalFormsPending,
          studentsByGrade,
          studentsByModality,
          sectionsPerAdviser,
          averageGradesPerGrade,
          failingStudentsCount,
        },
      }),
    );
  } catch (err) {
    console.error("Failed to fetch reports:", err);
    res.status(500).json(errorResponse("Failed to fetch reports", err.message));
  }
});

module.exports = router;
