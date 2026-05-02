-- Reset training onboarding state so every client can test the new PPL flow again.
UPDATE "User"
SET
  "trainingLevel" = NULL,
  "trainingGoal" = NULL,
  "trainingPlanKey" = NULL,
  "onboardingCompletedAt" = NULL;
