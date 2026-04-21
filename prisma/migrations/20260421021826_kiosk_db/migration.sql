-- CreateTable
CREATE TABLE "KioskSession" (
    "id" TEXT NOT NULL,
    "gymId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KioskSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KioskToken" (
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KioskToken_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "KioskSession_gymId_createdAt_idx" ON "KioskSession"("gymId", "createdAt");

-- CreateIndex
CREATE INDEX "KioskToken_sessionId_idx" ON "KioskToken"("sessionId");

-- CreateIndex
CREATE INDEX "KioskToken_expiresAt_idx" ON "KioskToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "KioskSession" ADD CONSTRAINT "KioskSession_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KioskToken" ADD CONSTRAINT "KioskToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KioskSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
