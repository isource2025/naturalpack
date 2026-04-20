import { NextRequest } from "next/server";
import { handle, ok, fail } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { discountService, applyDiscount } from "@/lib/services/discountService";

export const runtime = "nodejs";

/**
 * GET /api/discounts/validate?code=XXX&amount=12345
 *
 * Valida un código de descuento para el gym del usuario logueado y,
 * opcionalmente, calcula cuánto se aplicaría sobre `amount`. Sirve para
 * el formulario de registrar pago y para el socio (si quisiera anticipar).
 */
export const GET = handle(async (req: NextRequest) => {
  const session = requireSession();
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const amountRaw = req.nextUrl.searchParams.get("amount");
  if (!code) return fail(400, "VALIDATION_ERROR", "Falta el código");

  const discount = await discountService.resolveByCode(session.gymId, code);
  if (!discount) return fail(404, "NOT_FOUND", "Código inválido o inactivo");

  const amount = amountRaw ? Math.max(0, parseInt(amountRaw, 10) || 0) : null;
  const calc = amount
    ? applyDiscount(amount, discount)
    : { amount: null, discountAmount: null };

  return ok({
    code: discount.code,
    name: discount.name,
    percentOff: discount.percentOff,
    amountOff: discount.amountOff,
    total: calc.amount,
    discountAmount: calc.discountAmount,
  });
});
