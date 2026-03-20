/*
  Warnings:

  - The values [K12,SPECIAL_SCIENCE,SPECIAL_ARTS,ALS,OTHER] on the enum `Curriculum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Curriculum_new" AS ENUM ('Regular', 'STE', 'SPS', 'SPA', 'SPJ');
ALTER TABLE "public"."sections" ALTER COLUMN "curriculum" DROP DEFAULT;
ALTER TABLE "sections" ALTER COLUMN "curriculum" TYPE "Curriculum_new" USING ("curriculum"::text::"Curriculum_new");
ALTER TYPE "Curriculum" RENAME TO "Curriculum_old";
ALTER TYPE "Curriculum_new" RENAME TO "Curriculum";
DROP TYPE "public"."Curriculum_old";
ALTER TABLE "sections" ALTER COLUMN "curriculum" SET DEFAULT 'Regular';
COMMIT;

-- AlterTable
ALTER TABLE "sections" ALTER COLUMN "curriculum" SET DEFAULT 'Regular';
