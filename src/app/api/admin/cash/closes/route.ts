import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cashService } from "@/lib/services/cashService";

export const runtime = "nodejs";

/** GET /api/admin/cash/closes?limit=50 — historial de cierres. */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
  const items = await cashService.listCloses(session.gymId, limit);
  return ok({ items });
});
