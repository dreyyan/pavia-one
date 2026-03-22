/*
  Warnings:

  - A unique constraint covering the columns `[name,curriculum]` on the table `learning_areas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "learning_areas_name_curriculum_key" ON "learning_areas"("name", "curriculum");
