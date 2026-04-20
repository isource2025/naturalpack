import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireSuperadmin } from "@/lib/auth";
import { gymRepository } from "@/lib/repositories/gymRepository";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * DELETE /api/platform/gyms/[id]
 *
 * Elimina un gimnasio y en cascada TODO su contenido (usuarios, membresías,
 * pagos, accesos, descuentos, QRs, caja, auditoría). Operación destructiva:
 * - Se exige `?confirm=<slug>` para evitar borrados accidentales.
 * - Nunca se permite borrar el gym técnico "platform".
 */
export const DELETE = handle(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    requireSuperadmin();
    const gym = await gymRepository.findById(params.id);
    if (!gym) throw new NotFoundError("Gimnasio no encontrado");

    if (gym.slug === "platform") {
      throw new ForbiddenError(
        "El gimnasio 'platform' es interno y no puede eliminarse."
      );
    }

    const confirm = req.nextUrl.searchParams.get("confirm");
    if (confirm !== gym.slug) {
      throw new ValidationError(
        `Para borrar este gym enviá ?confirm=${gym.slug}`
      );
    }

    await gymRepository.delete(params.id);
    return ok({ deleted: { id: gym.id, slug: gym.slug, name: gym.name } });
  }
);
