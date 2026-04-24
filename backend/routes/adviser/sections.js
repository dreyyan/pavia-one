// [IMPORT] Setup
const express = require("express");
const router = express.Router();
const prisma = require("../../lib/prisma");

// [IMPORT] Tools
require("dotenv").config();
const jwt = require("jsonwebtoken");

// [IMPORT] Utilities & Middleware
const { successResponse, errorResponse } = require("../../utils/response");
const {
  getFullName,
  calculateAge,
  splitFullName,
} = require("../../utils/helpers");
const verifyAdviser = require("../../middleware/authMiddleware").verifyAdviser;

// ?[GET] Get Adviser's Sections
// /api/adviser/sections
router.get("/", verifyAdviser, async (req, res) => {
  try {
    // [1] Find numeric adviser ID
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // [2] Fetch sections with enrollment count
    const sections = await prisma.section.findMany({
      where: { adviserId: adviser.id },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                sex: true,
              },
            },
          },
        },
      },
      orderBy: { gradeLevel: "asc" },
    });

    if (!sections.length) {
      return res
        .status(404)
        .json(errorResponse("No sections found for this adviser"));
    }

    const formattedSections = sections.map((section) => {
      const maleCount = section.enrollments.filter(
        (e) => e.student.sex === "MALE",
      ).length;

      const femaleCount = section.enrollments.filter(
        (e) => e.student.sex === "FEMALE",
      ).length;

      return {
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        schoolYear: section.schoolYear,
        curriculum: section.curriculum,
        color: section.color,
        classSize: section.enrollments.length,
        maleCount,
        femaleCount,
        schedule: section.schedule,
      };
    });

    res.json(successResponse("Adviser sections retrieved", formattedSections));
  } catch (err) {
    console.error("Sections fetch error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch adviser sections", err.message));
  }
});

// ?[GET] Get Adviser's Section
// /api/adviser/sections/:id
router.get("/:id", verifyAdviser, async (req, res) => {
  const { id } = req.params; // section numeric ID

  try {
    // [1] Find numeric adviser ID first
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // [2] Fetch the specific section using numeric ID and adviser ID
    const section = await prisma.section.findFirst({
      where: {
        id: Number(id),
        adviserId: adviser.id,
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        schoolYear: true,
        curriculum: true,
        color: true,
        classSize: true,
        schedule: true,
        enrollments: {
          select: {
            student: {
              select: { sex: true },
            },
          },
        },
      },
    });

    if (!section) {
      return res
        .status(404)
        .json(errorResponse("Section not found for this adviser"));
    }

    const sectionWithCounts = {
      ...section,
      classSize: section.enrollments?.length ?? 0,
    };

    res.json(successResponse("Section retrieved", sectionWithCounts));
  } catch (err) {
    console.error("Section fetch error:", err);
    res.status(500).json(errorResponse("Failed to fetch section", err.message));
  }
});

// ?[GET] Get Students in Adviser's Section
// /api/adviser/sections/:id/students
router.get("/:id/students", verifyAdviser, async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id);
    if (isNaN(sectionId)) {
      return res.status(400).json(errorResponse("Invalid section ID"));
    }

    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "lrn",
      sortOrder = "asc",
    } = req.query;

    const pageNum = parseInt(page);
    const take = parseInt(limit);
    const skip = (pageNum - 1) * take;

    // [1] Get numeric adviser ID
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });

    if (!adviser) {
      return res.status(404).json(errorResponse("Adviser not found"));
    }

    // [2] Verify section belongs to adviser
    const section = await prisma.section.findFirst({
      where: { id: sectionId, adviserId: adviser.id },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        color: true,
        curriculum: true,
      },
    });

    if (!section) {
      return res
        .status(403)
        .json(errorResponse("Unauthorized or section not found"));
    }

    // [3] Enrollment filter
    const enrollmentWhere = {
      sectionId,
      student: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { middleName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { nameExtension: { contains: search, mode: "insensitive" } },
              { lrn: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    };

    // [4] Sorting
    let orderBy = { student: { lrn: "asc" } };

    if (["lrn", "firstName", "lastName"].includes(sortBy)) {
      orderBy = {
        student: { [sortBy]: sortOrder === "desc" ? "desc" : "asc" },
      };
    }

    // [5] Fetch enrollments WITH FULL student data
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        skip,
        take,
        orderBy,

        select: {
          student: {
            select: {
              id: true,
              lrn: true,
              firstName: true,
              middleName: true,
              lastName: true,
              nameExtension: true,
              sex: true,
              birthDate: true,
              motherTongue: true,
              ethnicGroup: true,
              religion: true,
              email: true,
              createdByAdviserId: true,
              createdAt: true,
              updatedAt: true,

              adviser: {
                select: { id: true, name: true, adviserId: true },
              },
              address: true,
              guardian: true,

              enrollments: {
                select: {
                  id: true,
                  sectionId: true,
                  schoolYear: true,
                  status: true,
                  learningModality: true,
                },
              },

              sf9Grades: true,
              sf9Summaries: true,
              sf5Reports: true,
              sf9CoreValues: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where: enrollmentWhere }),
    ]);

    // [6] Map to student objects + derived fields
    const students = enrollments.map((e) => {
      const s = e.student;

      let guardian = s.guardian;

      if (guardian) {
        const father = splitFullName(guardian.fatherFirstName);
        const mother = splitFullName(guardian.motherMaidenFirstName);

        guardian = {
          ...guardian,
          fatherFirstName: father.firstName,
          fatherMiddleName: father.middleName,
          fatherLastName: father.lastName,
          motherMaidenFirstName: mother.firstName,
          motherMaidenMiddleName: mother.middleName,
          motherMaidenLastName: mother.lastName,
        };
      }

      return {
        ...s,
        guardian,
        fullName: getFullName(s),
      };
    });

    // [7] Male / Female counts
    let maleCount = 0;
    let femaleCount = 0;

    students.forEach((student) => {
      if (student.sex === "MALE") maleCount++;
      else if (student.sex === "FEMALE") femaleCount++;
    });

    const totalPages = Math.ceil(total / take);

    res.json(
      successResponse("Students retrieved successfully", {
        section: {
          name: section.name,
          gradeLevel: section.gradeLevel,
          sectionColor: section.color,
          curriculum: section.curriculum,
          maleCount,
          femaleCount,
        },
        students,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      }),
    );
  } catch (err) {
    console.error("Adviser section students fetch error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to fetch students", err.message));
  }
});

// ?[GET] Get Section /w Students
// /api/adviser/sections/:sectionId
router.get("/:sectionId", verifyAdviser, async (req, res) => {
  const { sectionId } = req.params;
  try {
    // [1] Fetch the section only if managed by this adviser
    const section = await prisma.section.findFirst({
      where: {
        id: parseInt(sectionId),
        adviserId: req.adviserId, // enforce adviser access
      },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        createdAt: true,
        enrollments: {
          select: {
            student: {
              select: {
                id: true,
                lrn: true,
                firstName: true,
                middleName: true,
                lastName: true,
                nameExtension: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // [2] Return 404 if section not found or not managed by this adviser
    if (!section) {
      return res
        .status(404)
        .json(errorResponse("Section not found or not managed by you"));
    }

    // [3] Map enrollments to student objects
    const students = section.enrollments.map((e) => ({
      ...e.student,
      fullName: getFullName(e.student),
      age: calculateAge(e.student.birthDate),
    }));

    // *[SUCCESS] Return section with students
    res.json(
      successResponse("Section retrieved successfully", {
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        createdAt: section.createdAt,
        students,
      }),
    );
  } catch (err) {
    console.error("Adviser section fetch error:", err);
    res.status(500).json(errorResponse("Failed to fetch section", err.message));
  }
});

// ?[GET] Get Adviser's Section's Student
// /api/adviser/sections/:sectionId/students/:studentId
router.get(
  "/:sectionId/students/:studentId",
  verifyAdviser,
  async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const studentId = parseInt(req.params.studentId);

      console.log(
        "[REQUEST] GET /api/adviser/sections/:sectionId/students/:studentId",
        { sectionId, studentId },
      );

      // Get numeric adviser ID from token
      const adviser = await prisma.adviser.findUnique({
        where: { adviserId: req.adviserId },
        select: { id: true },
      });
      if (!adviser)
        return res.status(404).json(errorResponse("Adviser not found"));

      // Verify section belongs to adviser
      const section = await prisma.section.findFirst({
        where: { id: sectionId, adviserId: adviser.id },
        select: { id: true, name: true, gradeLevel: true },
      });
      if (!section)
        return res
          .status(403)
          .json(errorResponse("You do not manage this section"));

      // Fetch student enrollment including all details
      const enrollment = await prisma.enrollment.findFirst({
        where: { sectionId, studentId },
        include: {
          student: {
            include: {
              address: true,
              guardian: true,
              sf9Grades: { include: { items: true, learningArea: true } },
              sf9Summaries: true,
              sf5Reports: true,
              sf9CoreValues: true,
            },
          },
          section: { select: { id: true, name: true, gradeLevel: true } },
        },
      });
      if (!enrollment)
        return res
          .status(404)
          .json(errorResponse("Student not found in this section"));

      const s = enrollment.student;

      // Build flattened student response similar to admin
      const studentResponse = {
        id: s.id,
        lrn: s.lrn,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        nameExtension: s.nameExtension,
        fullName: getFullName(s),
        email: s.email,
        sex: s.sex,
        birthDate: s.birthDate,
        age: calculateAge(s.birthDate),
        sectionId: enrollment.sectionId,
        sectionName: enrollment.section.name,
        gradeLevel: enrollment.section.gradeLevel,
        houseNo: s.address?.streetAddress ?? "",
        barangay: s.address?.barangay ?? "",
        municipality: s.address?.municipalityCity ?? "",
        province: s.address?.province ?? "",
        fatherName:
          [
            s.guardian?.fatherLastName,
            s.guardian?.fatherFirstName,
            s.guardian?.fatherMiddleName,
          ]
            .filter(Boolean)
            .join(" ") || "",
        motherName:
          [
            s.guardian?.motherMaidenLastName,
            s.guardian?.motherMaidenFirstName,
            s.guardian?.motherMaidenMiddleName,
          ]
            .filter(Boolean)
            .join(" ") || "",
        guardianName: s.guardian?.guardianName ?? "",
        guardianRelationship: s.guardian?.guardianRelationship ?? "",
        guardianContact: s.guardian?.guardianContactNumber ?? "",
        learningModality: enrollment.learningModality ?? "",

        motherTongue: s.motherTongue ?? "",
        religion: s.religion ?? "",

        // Include enrollments (flatten learning areas)
        enrollments: (s.enrollments ?? []).map((enr) => ({
          ...enr,
          learningAreas: (enr.learningAreas ?? []).map(
            (ela) => ela.learningArea,
          ),
        })),
        // Include grades & related data
        sf9Grades: s.sf9Grades ?? [],
        sf9Summaries: s.sf9Summaries ?? [],
        sf5Reports: s.sf5Reports ?? [],
        sf9CoreValues: s.sf9CoreValues ?? [],
      };

      res.json(
        successResponse("Student retrieved successfully", studentResponse),
      );
    } catch (err) {
      console.error("Get student in section error:", err);
      res
        .status(500)
        .json(errorResponse("Failed to fetch student", err.message));
    }
  },
);

// ?[PUT] Update Student in Section
// /api/adviser/sections/:sectionId/students/:studentId
router.put(
  "/:sectionId/students/:studentId",
  verifyAdviser,
  async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const studentId = parseInt(req.params.studentId);

      if (isNaN(sectionId) || isNaN(studentId)) {
        return res
          .status(400)
          .json(errorResponse("Invalid section or student ID"));
      }

      const {
        lastName,
        firstName,
        middleName,
        sex,
        birthDate,
        houseNo,
        street,
        sitio,
        purok,
        barangay,
        municipality,
        province,
        fatherName,
        motherName,
        guardianName,
        guardianRelationship,
        guardianContact,
        learningModality,
      } = req.body;

      // Basic validation
      const requiredFields = {
        lastName,
        firstName,
        sex,
        birthDate,
        learningModality,
      };
      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value || value.toString().trim() === "")
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res
          .status(400)
          .json(
            errorResponse(
              `Missing required fields: ${missingFields.join(", ")}`,
            ),
          );
      }

      if (guardianContact && !/^\d+$/.test(guardianContact)) {
        return res
          .status(400)
          .json(errorResponse("Guardian contact must be numeric"));
      }

      // Verify adviser manages this section
      const adviser = await prisma.adviser.findUnique({
        where: { adviserId: req.adviserId },
        select: { id: true },
      });
      if (!adviser)
        return res.status(404).json(errorResponse("Adviser not found"));

      const section = await prisma.section.findFirst({
        where: { id: sectionId, adviserId: adviser.id },
        select: { id: true },
      });
      if (!section)
        return res
          .status(403)
          .json(errorResponse("You do not manage this section"));

      // Update student core info (only fields that exist in Student model)
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          lastName,
          firstName,
          middleName,
          sex,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });

      // Update or create address
      if (
        houseNo ||
        street ||
        sitio ||
        purok ||
        barangay ||
        municipality ||
        province
      ) {
        // Combine detailed fields into one DB field
        const streetAddress = [houseNo, street, sitio, purok]
          .filter((v) => v && v.trim() !== "")
          .join(" ")
          .trim();

        await prisma.address.upsert({
          where: { studentId },

          update: {
            streetAddress: streetAddress || null,
            barangay: barangay || null,
            municipalityCity: municipality || null,
            province: province || null,
          },

          create: {
            studentId,
            streetAddress: streetAddress || null,
            barangay: barangay || null,
            municipalityCity: municipality || null,
            province: province || null,
          },
        });
      }

      // Update or create guardian info
      if (
        fatherName ||
        motherName ||
        guardianName ||
        guardianRelationship ||
        guardianContact
      ) {
        const [fatherLastName, fatherFirstName, fatherMiddleName] = fatherName
          ? fatherName.split(" ")
          : [];
        const [motherLastName, motherFirstName, motherMiddleName] = motherName
          ? motherName.split(" ")
          : [];

        await prisma.guardian.upsert({
          where: { studentId },
          update: {
            fatherLastName: fatherLastName || "",
            fatherFirstName: fatherFirstName || "",
            fatherMiddleName: fatherMiddleName || "",
            motherMaidenLastName: motherLastName || "",
            motherMaidenFirstName: motherFirstName || "",
            motherMaidenMiddleName: motherMiddleName || "",
            guardianName: guardianName || "",
            guardianRelationship: guardianRelationship || "",
            guardianContactNumber: guardianContact || "",
          },
          create: {
            studentId,
            fatherLastName: fatherLastName || "",
            fatherFirstName: fatherFirstName || "",
            fatherMiddleName: fatherMiddleName || "",
            motherMaidenLastName: motherLastName || "",
            motherMaidenFirstName: motherFirstName || "",
            motherMaidenMiddleName: motherMiddleName || "",
            guardianName: guardianName || "",
            guardianRelationship: guardianRelationship || "",
            guardianContactNumber: guardianContact || "",
          },
        });
      }

      // Update enrollment info (learning modality)
      if (learningModality) {
        await prisma.enrollment.updateMany({
          where: { studentId, sectionId },
          data: { learningModality },
        });
      }

      res.json(successResponse("Student updated successfully", updatedStudent));
    } catch (err) {
      console.error("Update student error:", err);
      res
        .status(500)
        .json(errorResponse("Failed to update student", err.message));
    }
  },
);

// ?[POST] Bulk create students, enroll them, assign learning areas, and create SF9Grade
router.post("/enrollments", verifyAdviser, async (req, res) => {
  try {
    const {
      students,
      schoolYear,
      learningModality = "FACE_TO_FACE",
    } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0)
      return res.status(400).json(errorResponse("students array is required"));
    if (!schoolYear)
      return res.status(400).json(errorResponse("schoolYear is required"));

    // Get adviser
    const adviser = await prisma.adviser.findUnique({
      where: { adviserId: req.adviserId },
      select: { id: true },
    });
    if (!adviser)
      return res.status(404).json(errorResponse("Adviser not found"));

    const section = await prisma.section.findFirst({
      where: { adviserId: adviser.id },
      select: { id: true, gradeLevel: true, curriculum: true },
    });

    if (!section)
      return res
        .status(404)
        .json(errorResponse("Adviser has no assigned section"));

    const sectionId = section.id;

    // Check existing students by LRN
    const lrns = students.map((s) => s.lrn);
    const existingStudents = await prisma.student.findMany({
      where: { lrn: { in: lrns } },
      select: { id: true, lrn: true },
    });
    const existingLrns = existingStudents.map((s) => s.lrn);
    const newStudents = students.filter((s) => !existingLrns.includes(s.lrn));

    // Create new students
    const createdStudents = await Promise.all(
      newStudents.map((s) =>
        prisma.student.create({
          data: {
            lrn: s.lrn,
            firstName: s.firstName,
            middleName: s.middleName || null,
            lastName: s.lastName,
            nameExtension: s.nameExtension || null,
            sex: s.sex || null,
            birthDate: s.birthDate ? new Date(s.birthDate) : null,
            motherTongue: s.motherTongue || null,
            ethnicGroup: s.ethnicGroup || null,
            religion: s.religion || null,
            email: s.email || null,
            createdByAdviserId: req.adviserId,
            address: s.address
              ? {
                  create: {
                    streetAddress: s.address.streetAddress || null,
                    barangay: s.address.barangay || null,
                    municipalityCity: s.address.municipalityCity || null,
                    province: s.address.province || null,
                  },
                }
              : undefined,
            guardian: s.guardian
              ? {
                  create: {
                    fatherFirstName: s.guardian.fatherFirstName || null,
                    fatherMiddleName: s.guardian.fatherMiddleName || null,
                    fatherLastName: s.guardian.fatherLastName || null,
                    motherMaidenFirstName:
                      s.guardian.motherMaidenFirstName || null,
                    motherMaidenMiddleName:
                      s.guardian.motherMaidenMiddleName || null,
                    motherMaidenLastName:
                      s.guardian.motherMaidenLastName || null,
                    guardianName: s.guardian.guardianName || null,
                    guardianRelationship:
                      s.guardian.guardianRelationship || null,
                    guardianContactNumber:
                      s.guardian.guardianContactNumber || null,
                  },
                }
              : undefined,
          },
          select: { id: true, lrn: true },
        }),
      ),
    );

    const allStudents = [...existingStudents, ...createdStudents];

    // Check existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: allStudents.map((s) => s.id) },
        sectionId,
        schoolYear,
      },
      select: { id: true, studentId: true },
    });
    const alreadyEnrolledIds = existingEnrollments.map((e) => e.studentId);
    const toEnroll = allStudents.filter(
      (s) => !alreadyEnrolledIds.includes(s.id),
    );

    // Create enrollments
    if (toEnroll.length > 0) {
      await prisma.enrollment.createMany({
        data: toEnroll.map((s) => ({
          studentId: s.id,
          sectionId,
          schoolYear,
          learningModality,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch all enrollments for these students
    const allEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: { in: allStudents.map((s) => s.id) },
        sectionId,
        schoolYear,
      },
      select: { id: true, studentId: true },
    });

    // 🔹 Clean slate: remove old learning areas
    await prisma.enrollmentLearningArea.deleteMany({
      where: { enrollmentId: { in: allEnrollments.map((e) => e.id) } },
    });

    // 🔹 Assign learning areas based on gradeLevel & section.curriculum
    const allSubjects = await prisma.learningArea.findMany({
      where: { gradeLevel: section.gradeLevel },
      select: { id: true, name: true },
    });

    const curriculumSubjectsMap = {
      Regular: [
        "Filipino",
        "English",
        "Mathematics",
        "Science",
        "Araling Panlipunan",
        "Edukasyon sa Pagpapakatao",
        "MAPEH",
        "Edukasyong Pantahanan at Pangkabuhayan",
      ],
      STE: [
        "Filipino",
        "English",
        "Mathematics",
        "Science",
        "Araling Panlipunan",
        "MAPEH",
        "Research I",
        "Research II",
      ],
      SPS: [
        "Filipino",
        "English",
        "Mathematics",
        "Science",
        "Araling Panlipunan",
        "MAPEH",
        "Badminton",
      ],
      SPA: [
        "Filipino",
        "English",
        "Mathematics",
        "Science",
        "Araling Panlipunan",
        "MAPEH",
        "Visual Arts",
      ],
      SPJ: [
        "Filipino",
        "English",
        "Mathematics",
        "Science",
        "ICT",
        "Journalism",
      ],
    };

    const subjectsForCurriculum = allSubjects.filter((la) =>
      curriculumSubjectsMap[section.curriculum].includes(la.name),
    );

    const enrollmentLearningAreasData = [];
    const sf9GradesData = [];

    for (const enrollment of allEnrollments) {
      for (const la of subjectsForCurriculum) {
        enrollmentLearningAreasData.push({
          enrollmentId: enrollment.id,
          learningAreaId: la.id,
        });

        // Prepare SF9Grade creation
        sf9GradesData.push({
          studentId: enrollment.studentId,
          learningAreaId: la.id,
          schoolYear,
          q1: null,
          q2: null,
          q3: null,
          q4: null,
          q1Ready: false,
          q2Ready: false,
          q3Ready: false,
          q4Ready: false,
          finalRating: null,
          remarks: null,
        });
      }
    }

    // Create learning areas
    if (enrollmentLearningAreasData.length > 0) {
      await prisma.enrollmentLearningArea.createMany({
        data: enrollmentLearningAreasData,
        skipDuplicates: true,
      });
    }

    // Create SF9Grades (skip duplicates)
    if (sf9GradesData.length > 0) {
      await prisma.sF9Grade.createMany({
        data: sf9GradesData,
        skipDuplicates: true,
      });
    }

    res.json(
      successResponse(
        "Students enrolled, learning areas and SF9Grades auto-created successfully",
        {
          sectionId,
          totalStudentsProcessed: allStudents.length,
          studentsCreated: createdStudents.length,
          enrollmentsCreated: toEnroll.length,
          learningAreasAssigned:
            allEnrollments.length * subjectsForCurriculum.length,
          sf9GradesCreated:
            allEnrollments.length * subjectsForCurriculum.length,
        },
      ),
    );
  } catch (err) {
    console.error("Adviser bulk enrollment error:", err);
    res
      .status(500)
      .json(errorResponse("Failed to enroll students", err.message));
  }
});

module.exports = router;
