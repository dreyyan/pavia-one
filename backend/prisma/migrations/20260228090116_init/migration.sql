-- CreateEnum
CREATE TYPE "SF9GradeItemType" AS ENUM ('WRITTEN_WORK', 'PERFORMANCE_TASK', 'QUARTERLY_ASSESSMENT');

-- AlterTable
ALTER TABLE "learning_areas" ADD COLUMN     "performanceTaskWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "quarterlyAssessmentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
ADD COLUMN     "writtenWorkWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3;

-- CreateTable
CREATE TABLE "sf9_grade_items" (
    "id" SERIAL NOT NULL,
    "sf9GradeId" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "type" "SF9GradeItemType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sf9_grade_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sf9_grade_items" ADD CONSTRAINT "sf9_grade_items_sf9GradeId_fkey" FOREIGN KEY ("sf9GradeId") REFERENCES "sf9_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
