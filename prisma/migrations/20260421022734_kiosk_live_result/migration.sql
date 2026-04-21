-- CreateTable
CREATE TABLE "KioskLiveResult" (
    "sessionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KioskLiveResult_pkey" PRIMARY KEY ("sessionId")
);

-- AddForeignKey
ALTER TABLE "KioskLiveResult" ADD CONSTRAINT "KioskLiveResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "KioskSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
