-- DropForeignKey
ALTER TABLE "sections" DROP CONSTRAINT "sections_adviserId_fkey";

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "room" TEXT,
ALTER COLUMN "adviserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "advisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
