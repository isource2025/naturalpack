import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireSuperadmin } from "@/lib/auth";
import { GymStatusUpdateDTO } from "@/lib/dtos";
import { gymRepository } from "@/lib/repositories/gymRepository";
import { NotFoundError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * POST /api/platform/gyms/[id]/status
 *
 * Cambia el estado del gym (active | trial | suspended). Opcionalmente pasa
 * `trialEndsAt` (ISO string) para gyms en trial. Solo superadmin.
 */
export const POST = handle(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    requireSuperadmin();
    const body = await req.json();
    const input = GymStatusUpdateDTO.parse(body);

    const existing = await gymRepository.findById(params.id);
    if (!existing) throw new NotFoundError("Gimnasio no encontrado");

    const trialEndsAt =
      input.status === "trial" && input.trialEndsAt
        ? new Date(input.trialEndsAt)
        : input.status === "trial"
          ? existing.trialEndsAt
          : null;

    const gym = await gymRepository.updateStatus(
      params.id,
      input.status,
      trialEndsAt
    );

    return ok({ gym });
  }
);
