/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_resetToken_key" ON "Admin"("resetToken");
