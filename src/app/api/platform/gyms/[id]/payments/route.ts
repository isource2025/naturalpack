import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireSuperadmin } from "@/lib/auth";
import { PlatformPaymentCreateDTO } from "@/lib/dtos";
import { platformPaymentRepository } from "@/lib/repositories/platformPaymentRepository";
import { gymRepository } from "@/lib/repositories/gymRepository";
import { NotFoundError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/platform/gyms/[id]/payments
 * Lista de pagos de plataforma realizados por ese gym a NaturalPack.
 */
export const GET = handle(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    requireSuperadmin();
    const gym = await gymRepository.findById(params.id);
    if (!gym) throw new NotFoundError("Gimnasio no encontrado");
    const items = await platformPaymentRepository.listByGym(params.id);
    return ok({ items, gym: { id: gym.id, name: gym.name, slug: gym.slug } });
  }
);

/**
 * POST /api/platform/gyms/[id]/payments
 * Registra un nuevo pago del gym a la plataforma.
 */
export const POST = handle(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const session = requireSuperadmin();
    const body = await req.json();
    const input = PlatformPaymentCreateDTO.parse(body);

    const gym = await gymRepository.findById(params.id);
    if (!gym) throw new NotFoundError("Gimnasio no encontrado");

    const payment = await platformPaymentRepository.create({
      gymId: params.id,
      amount: input.amount,
      method: input.method,
      periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
      note: input.note,
      recordedByUserId: session.sub,
    });

    return ok({ payment }, { status: 201 });
  }
);
