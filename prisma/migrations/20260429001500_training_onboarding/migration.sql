-- Add onboarding and automatic routine fields to users.
ALTER TABLE "User"
ADD COLUMN "trainingLevel" TEXT,
ADD COLUMN "trainingGoal" TEXT,
ADD COLUMN "trainingPlanKey" TEXT,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
