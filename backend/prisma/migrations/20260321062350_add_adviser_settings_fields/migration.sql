-- AlterTable
ALTER TABLE "advisers" ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
