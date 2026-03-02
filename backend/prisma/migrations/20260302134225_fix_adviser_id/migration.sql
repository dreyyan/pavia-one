/*
  Warnings:

  - Changed the type of `adviserId` on the `sections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "sections" DROP CONSTRAINT "sections_adviserId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_createdByAdviserId_fkey";

-- DropIndex
DROP INDEX "sections_adviserId_key";

-- AlterTable
ALTER TABLE "sections" DROP COLUMN "adviserId",
ADD COLUMN     "adviserId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "advisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_createdByAdviserId_fkey" FOREIGN KEY ("createdByAdviserId") REFERENCES "advisers"("adviserId") ON DELETE CASCADE ON UPDATE CASCADE;
