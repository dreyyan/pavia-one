-- AlterTable
ALTER TABLE "learning_areas" ADD COLUMN     "adviserId" INTEGER;

-- AddForeignKey
ALTER TABLE "learning_areas" ADD CONSTRAINT "learning_areas_adviserId_fkey" FOREIGN KEY ("adviserId") REFERENCES "advisers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
