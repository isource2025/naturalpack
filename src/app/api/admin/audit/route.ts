import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { auditService } from "@/lib/services/auditService";

export const runtime = "nodejs";

/** GET /api/admin/audit?limit=50&cursor=xxx&action=payment.create */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const action = req.nextUrl.searchParams.get("action");
  const items = await auditService.listByGym(session.gymId, {
    limit,
    cursor,
    action,
  });
  return ok({ items });
});
