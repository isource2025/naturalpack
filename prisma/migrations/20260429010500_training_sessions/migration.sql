-- Store user completed training sessions by day.
CREATE TABLE "TrainingSessionCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gymId" TEXT,
  "dayKey" TEXT NOT NULL,
  "planKey" TEXT,
  "dayName" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingSessionCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingSessionCompletion_userId_dayKey_key"
ON "TrainingSessionCompletion"("userId", "dayKey");

CREATE INDEX "TrainingSessionCompletion_userId_completedAt_idx"
ON "TrainingSessionCompletion"("userId", "completedAt");

CREATE INDEX "TrainingSessionCompletion_gymId_completedAt_idx"
ON "TrainingSessionCompletion"("gymId", "completedAt");

ALTER TABLE "TrainingSessionCompletion"
ADD CONSTRAINT "TrainingSessionCompletion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingSessionCompletion"
ADD CONSTRAINT "TrainingSessionCompletion_gymId_fkey"
FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
