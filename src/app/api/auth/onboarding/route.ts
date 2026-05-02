import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { TrainingOnboardingDTO } from "@/lib/dtos";
import { authService } from "@/lib/services/authService";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";

export const POST = handle(async (req: NextRequest) => {
  const session = requireSession();
  const body = await req.json();
  const input = TrainingOnboardingDTO.parse(body);
  const result = await authService.completeTrainingOnboarding(session, input);
  return ok(result);
});
