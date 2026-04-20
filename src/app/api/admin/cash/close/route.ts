import { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cashService } from "@/lib/services/cashService";
import { auditService } from "@/lib/services/auditService";
import { userRepository } from "@/lib/repositories/userRepository";

export const runtime = "nodejs";

const BodyDTO = z.object({
  note: z.string().trim().max(500).optional(),
  /** Efectivo contado físicamente al cerrar (obligatorio). */
  declaredCashTotal: z.coerce.number().int().min(0).max(100_000_000),
});

/** POST /api/admin/cash/close — cerrar caja. */
export const POST = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { note, declaredCashTotal } = BodyDTO.parse(body);

  const close = await cashService.close(
    session.gymId,
    session.sub,
    declaredCashTotal,
    note ?? null
  );

  const actor = await userRepository.findById(session.sub);
  await auditService.log({
    gymId: session.gymId,
    actorUserId: session.sub,
    actorName: actor?.name ?? session.email,
    action: "cash.close",
    targetType: "cashClose",
    targetId: close.id,
    meta: {
      cashTotal: close.cashTotal,
      declaredCashTotal: close.declaredCashTotal,
      cashCount: close.cashCount,
      totalAll: close.totalAll,
      allCount: close.allCount,
      periodStart: close.periodStart ? close.periodStart.toISOString() : null,
      periodEnd: close.periodEnd.toISOString(),
      note: close.note,
    },
  });

  return ok(
    {
      close: {
        id: close.id,
        closedAt: close.closedAt.toISOString(),
        cashTotal: close.cashTotal,
        declaredCashTotal: close.declaredCashTotal,
        cashCount: close.cashCount,
        totalAll: close.totalAll,
        allCount: close.allCount,
        periodStart: close.periodStart ? close.periodStart.toISOString() : null,
        periodEnd: close.periodEnd.toISOString(),
        note: close.note,
      },
    },
    { status: 201 }
  );
});
