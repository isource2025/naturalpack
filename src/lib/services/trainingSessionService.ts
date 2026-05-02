import { trainingSessionRepository } from "../repositories/trainingSessionRepository";
import type { JwtPayload } from "../auth";
import type { CompleteTrainingSessionInput } from "../dtos";

function dayKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const trainingSessionService = {
  async completeToday(session: JwtPayload, input: CompleteTrainingSessionInput) {
    const dayKey = dayKeyLocal(new Date());
    await trainingSessionRepository.upsertToday({
      userId: session.sub,
      gymId: session.gymId,
      dayKey,
      planKey: input.planKey,
      dayName: input.dayName,
    });
    return { completed: true, dayKey };
  },

  async todayStatus(session: JwtPayload) {
    const dayKey = dayKeyLocal(new Date());
    const row = await trainingSessionRepository.findByUserAndDay(session.sub, dayKey);
    return {
      completed: !!row,
      dayKey,
      completedAt: row?.completedAt.toISOString() ?? null,
    };
  },
};
