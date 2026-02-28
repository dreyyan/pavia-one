-- DropForeignKey
ALTER TABLE "sf9_grade_items" DROP CONSTRAINT "sf9_grade_items_sf9GradeId_fkey";

-- AddForeignKey
ALTER TABLE "sf9_grade_items" ADD CONSTRAINT "sf9_grade_items_sf9GradeId_fkey" FOREIGN KEY ("sf9GradeId") REFERENCES "sf9_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
