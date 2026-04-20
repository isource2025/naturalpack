import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cashService } from "@/lib/services/cashService";

export const runtime = "nodejs";

/**
 * GET /api/admin/payments/daily?days=30&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Devuelve los pagos agrupados por día (TZ del servidor). Por defecto
 * trae los últimos 30 días. Cada bucket incluye el detalle completo
 * para que el cliente pueda expandir sin otro request.
 */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const sp = req.nextUrl.searchParams;
  const days = sp.get("days");
  const from = sp.get("from");
  const to = sp.get("to");

  const items = await cashService.dailyHistory(session.gymId, {
    days: days ? Math.min(Math.max(Number(days), 1), 180) : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });

  return ok({ items });
});
