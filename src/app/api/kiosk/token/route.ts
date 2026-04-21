import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { handle, ok, fail } from "@/lib/http";
import { resolveKioskPublicUrl } from "@/lib/kioskPublicBaseUrl";
import { kioskService } from "@/lib/services/kioskService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kiosk/token?sessionId=...
 *
 * Devuelve un token vigente para la sesión (reutiliza el último si aún no venció)
 * y el QR listo para mostrar: scanUrl + qrDataUrl (data URL PNG).
 */
export const GET = handle(async (req: NextRequest) => {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return fail(400, "BAD_REQUEST", "Falta sessionId");
  const out = await kioskService.issueToken(sessionId);
  const { baseUrl } = resolveKioskPublicUrl(req);
  const scanUrl = `${baseUrl}/scan?token=${encodeURIComponent(out.token)}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#07090d", light: "#ffffff" },
  });
  return ok({ ...out, scanUrl, qrDataUrl });
});
