import { NextRequest } from "next/server";
import { ValidateAccessDTO } from "@/lib/dtos";
import { accessService } from "@/lib/services/accessService";
import { handle, ok, fail } from "@/lib/http";

export const runtime = "nodejs";

/**
 * POST /api/access/validate
 *
 * Simula al lector de la entrada del gimnasio.
 * Protegido por un token simple (ACCESS_READER_TOKEN) que el lector físico
 * debe enviar como Bearer. El endpoint siempre emite un evento "access:result"
 * para que los kiosks suscritos actualicen su UI en tiempo real.
 */
export const POST = handle(async (req: NextRequest) => {
  const expected = process.env.ACCESS_READER_TOKEN;
  if (expected) {
    const header = req.headers.get("authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7) : header;
    if (token !== expected) {
      return fail(401, "UNAUTHORIZED", "Token de lector inválido");
    }
  }

  const body = await req.json();
  const input = ValidateAccessDTO.parse(body);
  const result = await accessService.validateAndLog(input.code);
  return ok(result);
});
