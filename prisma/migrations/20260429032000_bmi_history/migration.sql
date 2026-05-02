-- CreateTable
CREATE TABLE "BmiEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BmiEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BmiEntry_userId_measuredAt_idx" ON "BmiEntry"("userId", "measuredAt");

-- CreateIndex
CREATE INDEX "BmiEntry_gymId_measuredAt_idx" ON "BmiEntry"("gymId", "measuredAt");

-- AddForeignKey
ALTER TABLE "BmiEntry" ADD CONSTRAINT "BmiEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BmiEntry" ADD CONSTRAINT "BmiEntry_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
