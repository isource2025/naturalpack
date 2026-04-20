import { handle, ok } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { streakService } from "@/lib/services/streakService";

export const runtime = "nodejs";

/**
 * GET /api/me/streak
 *
 * Devuelve la racha actual del socio autenticado. La racha se mantiene mientras
 * cada semana pasada haya tenido al menos 2 días con asistencia "granted".
 */
export const GET = handle(async () => {
  const session = requireSession();
  const info = await streakService.compute(session.sub);
  return ok(info);
});
