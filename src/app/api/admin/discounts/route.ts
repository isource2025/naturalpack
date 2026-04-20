import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { DiscountCreateDTO } from "@/lib/dtos";
import { discountService } from "@/lib/services/discountService";
import { auditService } from "@/lib/services/auditService";
import { userRepository } from "@/lib/repositories/userRepository";

export const runtime = "nodejs";

/** GET /api/admin/discounts */
export const GET = handle(async () => {
  const session = requireAdmin();
  const items = await discountService.list(session.gymId);
  return ok({ items });
});

/** POST /api/admin/discounts */
export const POST = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const body = await req.json();
  const input = DiscountCreateDTO.parse(body);

  const discount = await discountService.create(input, session.gymId, session.sub);

  const actor = await userRepository.findById(session.sub);
  await auditService.log({
    gymId: session.gymId,
    actorUserId: session.sub,
    actorName: actor?.name ?? session.email,
    action: "discount.create",
    targetType: "discount",
    targetId: discount.id,
    meta: {
      name: discount.name,
      kind: discount.kind,
      code: discount.code,
      percentOff: discount.percentOff,
      amountOff: discount.amountOff,
      active: discount.active,
    },
  });

  return ok({ discount }, { status: 201 });
});
