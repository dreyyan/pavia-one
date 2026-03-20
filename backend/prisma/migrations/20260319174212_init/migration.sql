-- CreateTable
CREATE TABLE "enrollment_learning_areas" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "learningAreaId" INTEGER NOT NULL,

    CONSTRAINT "enrollment_learning_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_learning_areas_enrollmentId_learningAreaId_key" ON "enrollment_learning_areas"("enrollmentId", "learningAreaId");

-- AddForeignKey
ALTER TABLE "enrollment_learning_areas" ADD CONSTRAINT "enrollment_learning_areas_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_learning_areas" ADD CONSTRAINT "enrollment_learning_areas_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
