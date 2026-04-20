import { NextRequest } from "next/server";
import { handle, ok, fail } from "@/lib/http";
import { kioskService } from "@/lib/services/kioskService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kiosk/token?sessionId=...
 * Emite un token de corta vida (TTL ~30s) asociado a esa sesión.
 * El kiosk lo pinta como QR y antes del vencimiento pide uno nuevo.
 */
export const GET = handle(async (req: NextRequest) => {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return fail(400, "BAD_REQUEST", "Falta sessionId");
  const out = kioskService.issueToken(sessionId);
  return ok(out);
});
