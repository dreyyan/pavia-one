/*
  Warnings:

  - A unique constraint covering the columns `[gradeLevel,name]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_adviserId_fkey";

-- AlterTable
ALTER TABLE "Section" ALTER COLUMN "adviserId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Section_gradeLevel_name_key" ON "Section"("gradeLevel", "name");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "Adviser"("adviserId") ON DELETE RESTRICT ON UPDATE CASCADE;
