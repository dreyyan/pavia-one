/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `advisers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "advisers" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "advisers_resetToken_key" ON "advisers"("resetToken");
