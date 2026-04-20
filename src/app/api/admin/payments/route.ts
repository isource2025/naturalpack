import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { PaymentCreateDTO } from "@/lib/dtos";
import { paymentService } from "@/lib/services/paymentService";
import { auditService } from "@/lib/services/auditService";
import { userRepository } from "@/lib/repositories/userRepository";

export const runtime = "nodejs";

/** GET /api/admin/payments?limit=50&cursor=xxx */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const items = await paymentService.list(session.gymId, { limit, cursor });
  return ok({ items });
});

/** POST /api/admin/payments */
export const POST = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const body = await req.json();
  const input = PaymentCreateDTO.parse(body);

  const payment = await paymentService.create(input, session.gymId, session.sub);

  const actor = await userRepository.findById(session.sub);
  const customer = await userRepository.findById(input.userId);
  await auditService.log({
    gymId: session.gymId,
    actorUserId: session.sub,
    actorName: actor?.name ?? session.email,
    action: "payment.create",
    targetType: "payment",
    targetId: payment.id,
    meta: {
      userId: input.userId,
      userName: customer?.name ?? null,
      amount: payment.amount,
      listAmount: payment.listAmount,
      discountAmount: payment.discountAmount,
      discountCode: payment.discountCode,
      days: payment.days,
      method: payment.method,
    },
  });

  return ok({ payment }, { status: 201 });
});
