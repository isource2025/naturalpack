import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { CompleteTrainingSessionDTO } from "@/lib/dtos";
import { handle, ok } from "@/lib/http";
import { trainingSessionService } from "@/lib/services/trainingSessionService";

export const runtime = "nodejs";

export const GET = handle(async () => {
  const session = requireSession();
  const status = await trainingSessionService.todayStatus(session);
  return ok(status);
});

export const POST = handle(async (req: NextRequest) => {
  const session = requireSession();
  const body = await req.json().catch(() => ({}));
  const input = CompleteTrainingSessionDTO.parse(body ?? {});
  const result = await trainingSessionService.completeToday(session, input);
  return ok(result);
});
