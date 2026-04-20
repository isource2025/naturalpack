import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/userRepository";
import { accessLogRepository } from "@/lib/repositories/accessLogRepository";
import { daysRemaining } from "@/lib/services/authService";

export const runtime = "nodejs";

/**
 * GET /api/admin/users/[id]
 *
 * Detalle del socio para el panel derecho del módulo "Accesos".
 * Se valida que el user pertenezca al mismo gym que el admin.
 */
export const GET = handle(async (_req: Request, ctx: { params: { id: string } }) => {
  const session = requireAdmin();
  const user = await userRepository.findByIdWithRelations(ctx.params.id);
  if (!user) throw new NotFoundError("Socio no encontrado");
  if (user.gymId !== session.gymId) {
    throw new ForbiddenError("El socio pertenece a otro gym");
  }

  const latest = user.memberships[0] ?? null;
  const recent = await accessLogRepository.recentForUser(user.id, 20);

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt.toISOString(),
    membership: latest
      ? {
          status: latest.status,
          startDate: latest.startDate.toISOString(),
          endDate: latest.endDate.toISOString(),
          daysRemaining: daysRemaining(latest.endDate),
        }
      : null,
    recentAccesses: recent.map((r) => ({
      id: r.id,
      status: r.status as "granted" | "denied",
      reason: r.reason,
      timestamp: r.timestamp.toISOString(),
    })),
  });
});
