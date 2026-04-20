import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cashService } from "@/lib/services/cashService";

export const runtime = "nodejs";

/** GET /api/admin/cash/summary — resumen de caja abierta. */
export const GET = handle(async () => {
  const session = requireAdmin();
  const summary = await cashService.getOpenSummary(session.gymId);
  return ok(summary);
});
