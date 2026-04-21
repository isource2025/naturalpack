import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { resolveKioskPublicUrl } from "@/lib/kioskPublicBaseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kiosk/public-url
 *
 * Devuelve la baseUrl que el kiosk debe embeber en el QR.
 */
export const GET = handle(async (req: NextRequest) => {
  return ok(resolveKioskPublicUrl(req));
});
