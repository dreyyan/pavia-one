// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Middleware
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// [IMPORT] Utilities
const { successResponse, errorResponse } = require("../../utils/response");

// ?[GET] Get Adviser's Own Reports & Statistics
// /api/adviser/reports
router.get("/", verifyAdviser, async (req, res) => {
  try {
    const adviserId = req.adviserId;

    // [QUERY] Adviser profile
    const adviserProfile = await prisma.adviser.findUnique({
      where: { id: adviserId },
      select: { id: true, adviserId: true, name: true, email: true },
    });

    if (!adviserProfile) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // [QUERY] All sections belonging to this adviser
    const sections = await prisma.section.findMany({
      where: { adviserId },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolYear: true,
        curriculum: true,
      },
      orderBy: [{ schoolYear: "desc" }, { gradeLevel: "asc" }, { name: "asc" }],
    });

    const sectionIds = sections.map((s) => s.id);

    if (!sectionIds.length) {
      // * [EARLY RETURN] Adviser has no sections yet — return zeroed stats
      return res.json(
        successResponse("Reports retrieved successfully", {
          adviserProfile,
          data: {
            totalStudents: 0,
            totalSections: 0,
            totalFormsPending: 0,
            failingStudentsCount: 0,
            studentsByGrade: [],
            studentsByModality: [],
            averageGradesPerGrade: [],
            formStatusBreakdown: [],
            sectionSummaries: [],
          },
        }),
      );
    }

    // *────────────────────────────────────────────────
    // * KEY METRICS
    // *────────────────────────────────────────────────

    // [QUERY] Total enrolled students across all adviser's sections
    const totalStudents = await prisma.enrollment.count({
      where: { sectionId: { in: sectionIds }, status: "ENROLLED" },
    });

    // [QUERY] Pending school forms for adviser's sections
    const totalFormsPending = await prisma.schoolForm.count({
      where: {
        sectionId: { in: sectionIds },
        status: "DRAFT",
      },
    });

    // *────────────────────────────────────────────────
    // * STUDENTS BY GRADE LEVEL
    // *────────────────────────────────────────────────

    // [QUERY] Count enrollments per section, then aggregate by gradeLevel
    const sectionsWithCounts = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: {
        gradeLevel: true,
        _count: { select: { enrollments: true } },
      },
    });

    const gradeMap = {};
    sectionsWithCounts.forEach((s) => {
      gradeMap[s.gradeLevel] =
        (gradeMap[s.gradeLevel] || 0) + s._count.enrollments;
    });

    const studentsByGrade = Object.entries(gradeMap)
      .map(([gradeLevel, count]) => ({
        gradeLevel: parseInt(gradeLevel),
        count,
      }))
      .sort((a, b) => a.gradeLevel - b.gradeLevel);

    // *────────────────────────────────────────────────
    // * STUDENTS BY LEARNING MODALITY
    // *────────────────────────────────────────────────

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: { in: sectionIds }, status: "ENROLLED" },
      select: { learningModality: true },
    });

    const modalityMap = {};
    enrollments.forEach((e) => {
      const mod = e.learningModality || "Unknown";
      modalityMap[mod] = (modalityMap[mod] || 0) + 1;
    });

    const studentsByModality = Object.entries(modalityMap).map(
      ([modality, count]) => ({ modality, count }),
    );

    // *────────────────────────────────────────────────
    // * AVERAGE GRADES PER GRADE LEVEL
    // *────────────────────────────────────────────────

    // [QUERY] Students enrolled in adviser's sections
    const enrollmentsForGrades = await prisma.enrollment.findMany({
      where: { sectionId: { in: sectionIds } },
      select: { studentId: true, section: { select: { gradeLevel: true } } },
    });

    const studentGradeMap = {};
    enrollmentsForGrades.forEach((e) => {
      if (e.section?.gradeLevel) {
        studentGradeMap[e.studentId] = e.section.gradeLevel;
      }
    });

    const studentIds = Object.keys(studentGradeMap).map(Number);

    // [QUERY] SF9 final ratings for those students only
    const sf9Grades = await prisma.sF9Grade.findMany({
      where: { studentId: { in: studentIds } },
      select: { finalRating: true, studentId: true },
    });

    const gradeSumCount = {};
    sf9Grades.forEach((g) => {
      const gradeLevel = studentGradeMap[g.studentId];
      if (gradeLevel && g.finalRating != null) {
        if (!gradeSumCount[gradeLevel])
          gradeSumCount[gradeLevel] = { sum: 0, count: 0 };
        gradeSumCount[gradeLevel].sum += g.finalRating;
        gradeSumCount[gradeLevel].count += 1;
      }
    });

    const averageGradesPerGrade = Object.entries(gradeSumCount)
      .map(([gradeLevel, { sum, count }]) => ({
        gradeLevel: parseInt(gradeLevel),
        average: count > 0 ? Number((sum / count).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.gradeLevel - b.gradeLevel);

    // *────────────────────────────────────────────────
    // * FAILING STUDENTS
    // *────────────────────────────────────────────────

    // [QUERY] Count SF9 grades below 75 for students in adviser's sections
    const failingStudentsCount = await prisma.sF9Grade.count({
      where: {
        studentId: { in: studentIds },
        finalRating: { lt: 75 },
      },
    });

    // *────────────────────────────────────────────────
    // * SCHOOL FORM STATUS BREAKDOWN
    // *────────────────────────────────────────────────

    // [QUERY] Count forms by status across adviser's sections
    const formsByStatus = await prisma.schoolForm.groupBy({
      by: ["status"],
      where: { sectionId: { in: sectionIds } },
      _count: { id: true },
    });

    const formStatusBreakdown = formsByStatus.map((f) => ({
      status: f.status,
      count: f._count.id,
    }));

    // *────────────────────────────────────────────────
    // * PER-SECTION SUMMARIES
    // *────────────────────────────────────────────────

    // [QUERY] Per-section enrolled count + SF9 completion rate
    const sectionSummaries = await Promise.all(
      sections.map(async (section) => {
        const enrolledCount = await prisma.enrollment.count({
          where: { sectionId: section.id, status: "ENROLLED" },
        });

        // [COMPUTE] SF9 completion = students where all 4 quarters are ready
        const sectionStudentIds = (
          await prisma.enrollment.findMany({
            where: { sectionId: section.id, status: "ENROLLED" },
            select: { studentId: true },
          })
        ).map((e) => e.studentId);

        let sf9CompleteCount = 0;
        if (sectionStudentIds.length > 0) {
          // [QUERY] Students with at least one SF9 grade where all quarters ready
          const readyGrades = await prisma.sF9Grade.groupBy({
            by: ["studentId"],
            where: {
              studentId: { in: sectionStudentIds },
              q1Ready: true,
              q2Ready: true,
              q3Ready: true,
              q4Ready: true,
            },
          });
          sf9CompleteCount = readyGrades.length;
        }

        return {
          sectionId: section.id,
          sectionName: `${section.name}`,
          gradeLevel: section.gradeLevel,
          schoolYear: section.schoolYear,
          enrolledCount,
          sf9CompleteCount,
          sf9PendingCount: enrolledCount - sf9CompleteCount,
        };
      }),
    );

    res.json(
      successResponse("Reports retrieved successfully", {
        adviserProfile,
        data: {
          totalStudents,
          totalSections: sectionIds.length,
          totalFormsPending,
          failingStudentsCount,
          studentsByGrade,
          studentsByModality,
          averageGradesPerGrade,
          formStatusBreakdown,
          sectionSummaries,
        },
      }),
    );
  } catch (err) {
    // ! [ERROR] Reports fetch failed
    console.error("Failed to fetch adviser reports:", err);
    res.status(500).json(errorResponse("Failed to fetch reports", err.message));
  }
});

module.exports = router;
