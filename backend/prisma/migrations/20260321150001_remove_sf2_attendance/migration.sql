/*
  Warnings:

  - The values [SF2] on the enum `SchoolFormType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `sf2_daily_totals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sf2_monthly_summary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sf2_student_attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SchoolFormType_new" AS ENUM ('SF1', 'SF5');
ALTER TABLE "school_forms" ALTER COLUMN "type" TYPE "SchoolFormType_new" USING ("type"::text::"SchoolFormType_new");
ALTER TYPE "SchoolFormType" RENAME TO "SchoolFormType_old";
ALTER TYPE "SchoolFormType_new" RENAME TO "SchoolFormType";
DROP TYPE "public"."SchoolFormType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "sf2_daily_totals" DROP CONSTRAINT "sf2_daily_totals_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "sf2_monthly_summary" DROP CONSTRAINT "sf2_monthly_summary_studentId_fkey";

-- DropForeignKey
ALTER TABLE "sf2_student_attendance" DROP CONSTRAINT "sf2_student_attendance_studentId_fkey";

-- DropTable
DROP TABLE "sf2_daily_totals";

-- DropTable
DROP TABLE "sf2_monthly_summary";

-- DropTable
DROP TABLE "sf2_student_attendance";

-- DropEnum
DROP TYPE "Attendance";
