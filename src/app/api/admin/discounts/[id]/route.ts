import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import {
  DiscountActiveDTO,
  DiscountUpdateDTO,
} from "@/lib/dtos";
import { discountService } from "@/lib/services/discountService";
import { auditService } from "@/lib/services/auditService";
import { userRepository } from "@/lib/repositories/userRepository";

export const runtime = "nodejs";

/** PATCH /api/admin/discounts/:id — edit completo O toggle si {active} solo */
export const PATCH = handle(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const session = requireAdmin();
    const body = await req.json();
    const keys = Object.keys(body || {});

    // Toggle rápido: {active: boolean}.
    if (keys.length === 1 && keys[0] === "active") {
      const { active } = DiscountActiveDTO.parse(body);
      const d = await discountService.setActive(ctx.params.id, active, session.gymId);

      const actor = await userRepository.findById(session.sub);
      await auditService.log({
        gymId: session.gymId,
        actorUserId: session.sub,
        actorName: actor?.name ?? session.email,
        action: active ? "discount.activate" : "discount.deactivate",
        targetType: "discount",
        targetId: d.id,
        meta: { name: d.name, code: d.code, kind: d.kind, active },
      });

      return ok({ discount: d });
    }

    const input = DiscountUpdateDTO.parse(body);
    const d = await discountService.update(ctx.params.id, input, session.gymId);

    const actor = await userRepository.findById(session.sub);
    await auditService.log({
      gymId: session.gymId,
      actorUserId: session.sub,
      actorName: actor?.name ?? session.email,
      action: "discount.update",
      targetType: "discount",
      targetId: d.id,
      meta: { name: d.name, code: d.code, changes: input },
    });

    return ok({ discount: d });
  }
);

/** DELETE /api/admin/discounts/:id */
export const DELETE = handle(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const session = requireAdmin();
    const existing = await discountService.findById(ctx.params.id, session.gymId);
    await discountService.delete(ctx.params.id, session.gymId);

    const actor = await userRepository.findById(session.sub);
    await auditService.log({
      gymId: session.gymId,
      actorUserId: session.sub,
      actorName: actor?.name ?? session.email,
      action: "discount.delete",
      targetType: "discount",
      targetId: ctx.params.id,
      meta: existing
        ? { name: existing.name, code: existing.code, kind: existing.kind }
        : null,
    });

    return ok({ deleted: true });
  }
);
