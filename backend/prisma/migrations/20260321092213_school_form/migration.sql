-- CreateEnum
CREATE TYPE "SchoolFormType" AS ENUM ('SF1', 'SF2', 'SF5');

-- CreateEnum
CREATE TYPE "SchoolFormStatus" AS ENUM ('DRAFT', 'GENERATED', 'SUBMITTED', 'APPROVED', 'LOCKED');

-- CreateTable
CREATE TABLE "school_forms" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "type" "SchoolFormType" NOT NULL,
    "status" "SchoolFormStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "generatedBy" INTEGER,
    "approvedBy" INTEGER,

    CONSTRAINT "school_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_forms_sectionId_schoolYear_type_key" ON "school_forms"("sectionId", "schoolYear", "type");

-- AddForeignKey
ALTER TABLE "school_forms" ADD CONSTRAINT "school_forms_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
