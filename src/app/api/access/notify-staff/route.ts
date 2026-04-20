import { handle, ok } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { accessService } from "@/lib/services/accessService";

export const runtime = "nodejs";

/**
 * POST /api/access/notify-staff
 *
 * Alternativa al QR: el socio autenticado avisa al personal desde su dashboard
 * y el kiosk del gym refleja el acceso en tiempo real (igual que escanear).
 *
 * No recibe payload. Usa el userId de la cookie y resuelve la sesión de kiosk
 * en el servidor (kioskService.findLatestSessionByGym).
 */
export const POST = handle(async () => {
  const session = requireSession();
  const result = await accessService.notifyStaff({ userId: session.sub });
  return ok(result);
});
