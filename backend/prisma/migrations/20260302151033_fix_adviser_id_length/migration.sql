/*
  Warnings:

  - You are about to alter the column `adviserId` on the `advisers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(9)` to `VarChar(8)`.

*/
-- AlterTable
ALTER TABLE "advisers" ALTER COLUMN "adviserId" SET DATA TYPE VARCHAR(8);
