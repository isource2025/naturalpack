import { NextRequest } from "next/server";
import { getLastAccessResult } from "@/lib/events/bus";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/access/last?gymId=...
 * Fallback de polling para el kiosk (alternativa a SSE).
 * Devuelve el último evento de acceso conocido o null si no hay ninguno aún.
 */
export const GET = handle(async (req: NextRequest) => {
  const gymId = req.nextUrl.searchParams.get("gymId");
  const last = getLastAccessResult(gymId);
  return ok(last);
});
