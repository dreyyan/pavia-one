/*
  Warnings:

  - You are about to drop the `Adviser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Attendance" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NCR', 'CAR', 'REGION_I', 'REGION_II', 'REGION_III', 'REGION_IV_A', 'REGION_IV_B', 'REGION_V', 'REGION_VI', 'NIR', 'REGION_VII', 'REGION_VIII', 'REGION_IX', 'REGION_X', 'REGION_XI', 'REGION_XII', 'REGION_XIII', 'BARMM');

-- CreateEnum
CREATE TYPE "LearningModality" AS ENUM ('FACE_TO_FACE', 'DISTANCE_LEARNING', 'BLENDED', 'ONLINE', 'HOMESCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'TRANSFERRED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "Curriculum" AS ENUM ('K12', 'SPECIAL_SCIENCE', 'SPECIAL_ARTS', 'ALS', 'OTHER');

-- CreateEnum
CREATE TYPE "CoreValueName" AS ENUM ('MAKADIYOS', 'MAKATAO', 'MAKAKALIKASAN', 'MAKABANSA');

-- CreateEnum
CREATE TYPE "QuarterRating" AS ENUM ('AO', 'SO', 'RO', 'NO');

-- CreateEnum
CREATE TYPE "SF5ActionTaken" AS ENUM ('PROMOTED', 'CONDITIONAL', 'RETAINED');

-- CreateEnum
CREATE TYPE "SF9Remarks" AS ENUM ('PASSED', 'FAILED', 'INC');

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_adviserId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_createdByAdviserId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropTable
DROP TABLE "Adviser";

-- DropTable
DROP TABLE "Section";

-- DropTable
DROP TABLE "Student";

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "schoolIdNumber" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "division" TEXT NOT NULL,
    "district" TEXT,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisers" (
    "id" SERIAL NOT NULL,
    "adviserId" VARCHAR(9) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advisers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "adviserId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "curriculum" "Curriculum" NOT NULL DEFAULT 'K12',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "lrn" VARCHAR(12) NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "nameExtension" TEXT,
    "sex" "Sex" NOT NULL,
    "birthDate" DATE NOT NULL,
    "motherTongue" TEXT,
    "ethnicGroup" TEXT,
    "religion" TEXT,
    "email" TEXT,
    "password" TEXT,
    "createdByAdviserId" TEXT NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "streetAddress" TEXT,
    "barangay" TEXT,
    "municipalityCity" TEXT,
    "province" TEXT,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "fatherFirstName" TEXT,
    "fatherMiddleName" TEXT,
    "fatherLastName" TEXT,
    "motherMaidenFirstName" TEXT,
    "motherMaidenMiddleName" TEXT,
    "motherMaidenLastName" TEXT,
    "guardianName" TEXT,
    "guardianRelationship" TEXT,
    "guardianContactNumber" TEXT,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "learningModality" "LearningModality" NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrollmentDate" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf2_daily_totals" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "totalMale" INTEGER NOT NULL DEFAULT 0,
    "totalFemale" INTEGER NOT NULL DEFAULT 0,
    "totalCombined" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sf2_daily_totals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf2_student_attendance" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" "Attendance" NOT NULL,

    CONSTRAINT "sf2_student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf2_monthly_summary" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "totalPresent" INTEGER NOT NULL DEFAULT 0,
    "totalAbsent" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,

    CONSTRAINT "sf2_monthly_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_areas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "learning_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf9_grades" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "learningAreaId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "q1" INTEGER,
    "q2" INTEGER,
    "q3" INTEGER,
    "q4" INTEGER,
    "finalRating" INTEGER,
    "remarks" "SF9Remarks",

    CONSTRAINT "sf9_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_values" (
    "id" SERIAL NOT NULL,
    "name" "CoreValueName" NOT NULL,
    "description" TEXT,

    CONSTRAINT "core_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf5_reports" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "generalAverage" INTEGER,
    "actionTaken" "SF5ActionTaken" NOT NULL,
    "learningAreasNotMet" TEXT[],

    CONSTRAINT "sf5_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf9_core_values" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "coreValueId" INTEGER NOT NULL,
    "q1" "QuarterRating",
    "q2" "QuarterRating",
    "q3" "QuarterRating",
    "q4" "QuarterRating",

    CONSTRAINT "sf9_core_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sf9_summaries" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "generalAverage" INTEGER,

    CONSTRAINT "sf9_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_schoolIdNumber_key" ON "schools"("schoolIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "advisers_adviserId_key" ON "advisers"("adviserId");

-- CreateIndex
CREATE UNIQUE INDEX "advisers_email_key" ON "advisers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sections_adviserId_key" ON "sections"("adviserId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_schoolYear_gradeLevel_name_key" ON "sections"("schoolYear", "gradeLevel", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_lrn_key" ON "students"("lrn");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_studentId_key" ON "addresses"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_studentId_key" ON "guardians"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_schoolYear_key" ON "enrollments"("studentId", "schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "sf2_daily_totals_sectionId_attendanceDate_key" ON "sf2_daily_totals"("sectionId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "sf2_student_attendance_studentId_attendanceDate_key" ON "sf2_student_attendance"("studentId", "attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "sf2_monthly_summary_studentId_schoolYear_month_key" ON "sf2_monthly_summary"("studentId", "schoolYear", "month");

-- CreateIndex
CREATE UNIQUE INDEX "sf9_grades_studentId_learningAreaId_schoolYear_key" ON "sf9_grades"("studentId", "learningAreaId", "schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "sf9_core_values_studentId_coreValueId_key" ON "sf9_core_values"("studentId", "coreValueId");

-- CreateIndex
CREATE UNIQUE INDEX "sf9_summaries_studentId_schoolYear_key" ON "sf9_summaries"("studentId", "schoolYear");

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "advisers"("adviserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_createdByAdviserId_fkey" FOREIGN KEY ("createdByAdviserId") REFERENCES "advisers"("adviserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf2_daily_totals" ADD CONSTRAINT "sf2_daily_totals_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf2_student_attendance" ADD CONSTRAINT "sf2_student_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf2_monthly_summary" ADD CONSTRAINT "sf2_monthly_summary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf9_grades" ADD CONSTRAINT "sf9_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf9_grades" ADD CONSTRAINT "sf9_grades_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf5_reports" ADD CONSTRAINT "sf5_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf9_core_values" ADD CONSTRAINT "sf9_core_values_coreValueId_fkey" FOREIGN KEY ("coreValueId") REFERENCES "core_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf9_core_values" ADD CONSTRAINT "sf9_core_values_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sf9_summaries" ADD CONSTRAINT "sf9_summaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
