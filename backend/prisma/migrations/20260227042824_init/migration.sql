-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_createdByAdviserId_fkey";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "createdByAdviserId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_createdByAdviserId_fkey" FOREIGN KEY ("createdByAdviserId") REFERENCES "Adviser"("adviserId") ON DELETE RESTRICT ON UPDATE CASCADE;
