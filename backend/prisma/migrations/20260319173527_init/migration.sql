/*
  Warnings:

  - You are about to drop the column `accountStatus` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `mustChangePassword` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "accountStatus",
DROP COLUMN "mustChangePassword",
DROP COLUMN "password";
