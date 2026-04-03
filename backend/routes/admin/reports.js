// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Middleware
const { verifyAdmin } = require("../../middleware/authMiddleware");

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");
const { SchoolFormStatus } = require("@prisma/client");

// ?[GET] Get School Reports
// /api/admin/reports
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Admin profile
    const adminProfile = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });

    if (!adminProfile) {
      return res.status(404).json(errorResponse("Admin not found"));
    }

    // Key metrics
    const [totalStudents, totalAdvisers, totalSections, totalFormsPending] =
      await Promise.all([
        prisma.student.count(),
        prisma.adviser.count(),
        prisma.section.count(),
        prisma.schoolForm.count({
          where: { status: SchoolFormStatus.DRAFT },
        }),
      ]);

    // Students by Grade Level
    const sectionsWithEnrollments = await prisma.section.findMany({
      select: {
        gradeLevel: true,
        _count: { select: { enrollments: true } }, // Much more efficient than fetching all enrollments
      },
    });

    const studentsByGradeMap = {};
    sectionsWithEnrollments.forEach((section) => {
      studentsByGradeMap[section.gradeLevel] =
        (studentsByGradeMap[section.gradeLevel] || 0) +
        section._count.enrollments;
    });

    const studentsByGrade = Object.entries(studentsByGradeMap).map(
      ([gradeLevel, count]) => ({
        gradeLevel: parseInt(gradeLevel),
        count,
      }),
    );

    // Students by Learning Modality
    const enrollments = await prisma.enrollment.findMany({
      select: { learningModality: true },
    });

    const modalityMap = {};
    enrollments.forEach((e) => {
      const mod = e.learningModality || "Unknown";
      modalityMap[mod] = (modalityMap[mod] || 0) + 1;
    });

    const studentsByModality = Object.entries(modalityMap).map(
      ([modality, count]) => ({
        modality,
        count,
      }),
    );

    // Sections per Adviser (Optimized - avoid N+1)
    const sectionsPerAdviserRaw = await prisma.section.groupBy({
      by: ["adviserId"],
      _count: { id: true },
    });

    const adviserIds = sectionsPerAdviserRaw
      .map((s) => s.adviserId)
      .filter(Boolean);

    const advisers = await prisma.adviser.findMany({
      where: { id: { in: adviserIds } },
      select: { id: true, name: true },
    });

    const adviserMap = {};
    advisers.forEach((a) => {
      adviserMap[a.id] = a.name;
    });

    const sectionsPerAdviser = sectionsPerAdviserRaw.map((s) => ({
      adviserName: adviserMap[s.adviserId] || "Unknown Adviser",
      sections: s._count.id,
    }));

    // Average Grades per Grade Level (Fixed nested access)
    const sf9Grades = await prisma.sF9Grade.findMany({
      select: { finalRating: true, studentId: true },
    });

    const enrollmentsForGrades = await prisma.enrollment.findMany({
      select: {
        studentId: true,
        section: { select: { gradeLevel: true } },
      },
    });

    const studentGradeMap = {};
    enrollmentsForGrades.forEach((enroll) => {
      if (enroll.section?.gradeLevel) {
        studentGradeMap[enroll.studentId] = enroll.section.gradeLevel;
      }
    });

    const gradeSumCount = {};
    sf9Grades.forEach((grade) => {
      const gradeLevel = studentGradeMap[grade.studentId];
      if (gradeLevel && grade.finalRating != null) {
        if (!gradeSumCount[gradeLevel]) {
          gradeSumCount[gradeLevel] = { sum: 0, count: 0 };
        }
        gradeSumCount[gradeLevel].sum += grade.finalRating;
        gradeSumCount[gradeLevel].count += 1;
      }
    });

    const averageGradesPerGrade = Object.entries(gradeSumCount).map(
      ([gradeLevel, { sum, count }]) => ({
        gradeLevel: parseInt(gradeLevel),
        average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
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
