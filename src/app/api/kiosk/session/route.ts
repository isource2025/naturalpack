import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { kioskService } from "@/lib/services/kioskService";

export const runtime = "nodejs";

/**
 * POST /api/kiosk/session
 *
 * Crea una sesión de totem (la pantalla montada en la entrada del gym).
 *
 * - Requiere rol admin: solo el dueño abre el totem.
 * - El gymId se toma EXCLUSIVAMENTE del JWT del admin. Cualquier valor que
 *   venga en el body se ignora para evitar que un admin cree una sesión en
 *   un gym ajeno.
 */
export const POST = handle(async (_req: NextRequest) => {
  const session = requireAdmin();
  const kiosk = kioskService.createSession(session.gymId);
  return ok(kiosk, { status: 201 });
});
