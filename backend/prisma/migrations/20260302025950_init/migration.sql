-- DropForeignKey
ALTER TABLE "sf2_student_attendance" DROP CONSTRAINT "sf2_student_attendance_studentId_fkey";

-- AddForeignKey
ALTER TABLE "sf2_student_attendance" ADD CONSTRAINT "sf2_student_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
