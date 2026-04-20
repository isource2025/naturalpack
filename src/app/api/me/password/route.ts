import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { ChangePasswordDTO } from "@/lib/dtos";
import { authService } from "@/lib/services/authService";

export const runtime = "nodejs";

/**
 * POST /api/me/password
 *
 * Cambia la contraseña del usuario autenticado. Requiere la contraseña
 * actual por seguridad. No rota la sesión: el JWT sigue siendo válido.
 */
export const POST = handle(async (req: NextRequest) => {
  const session = requireSession();
  const body = await req.json();
  const input = ChangePasswordDTO.parse(body);
  await authService.changePassword(session, input);
  return ok({ changed: true });
});
