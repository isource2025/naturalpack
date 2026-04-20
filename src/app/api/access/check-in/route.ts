import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { CheckInDTO } from "@/lib/dtos";
import { requireSession } from "@/lib/auth";
import { accessService } from "@/lib/services/accessService";

export const runtime = "nodejs";

/**
 * POST /api/access/check-in
 *
 * Flujo principal del MVP: el socio autenticado escanea el QR de la pantalla
 * del gym desde su app, y esta ruta:
 *  - Valida la cookie del socio (requireSession).
 *  - Consume el token del kiosk (single-use) en kioskService.
 *  - Verifica estado de membresía.
 *  - Registra AccessLog.
 *  - Emite "access:result" por el bus para que la pantalla kiosk se actualice.
 */
export const POST = handle(async (req: NextRequest) => {
  const session = requireSession();
  const body = await req.json();
  const input = CheckInDTO.parse(body);
  const result = await accessService.checkIn({
    userId: session.sub,
    kioskToken: input.token,
  });
  return ok(result);
});
