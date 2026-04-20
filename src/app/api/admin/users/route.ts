import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { AdminCreateUserDTO } from "@/lib/dtos";
import { requireAdmin } from "@/lib/auth";
import { authService, daysRemaining } from "@/lib/services/authService";
import { userRepository } from "@/lib/repositories/userRepository";
import { auditService } from "@/lib/services/auditService";

export const runtime = "nodejs";

/**
 * GET /api/admin/users?role=client
 *
 * Lista usuarios del gym del admin con su última membresía. Se usa en la card
 * "Lista de clientes" del panel de administración.
 *  - role opcional: "client" | "admin" para filtrar.
 */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const roleParam = req.nextUrl.searchParams.get("role");
  const role =
    roleParam === "client" || roleParam === "admin" ? roleParam : undefined;

  const rows = await userRepository.listByGym(session.gymId, { role });
  const items = rows.map((u) => {
    const latest = u.memberships[0] ?? null;
    const dr = latest ? daysRemaining(latest.endDate) : 0;
    const effectiveStatus: "active" | "expired" | "cancelled" | "none" = latest
      ? latest.status === "active" && dr > 0
        ? "active"
        : (latest.status as "expired" | "cancelled")
      : "none";
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt.toISOString(),
      membership: latest
        ? {
            status: effectiveStatus,
            rawStatus: latest.status,
            startDate: latest.startDate.toISOString(),
            endDate: latest.endDate.toISOString(),
            daysRemaining: dr,
          }
        : null,
    };
  });

  return ok({ items });
});

/**
 * POST /api/admin/users
 * Registro administrativo de un nuevo socio dentro del mismo gym del admin.
 * Requiere sesión con rol admin (requireAdmin).
 */
export const POST = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const body = await req.json();
  const input = AdminCreateUserDTO.parse(body);
  const user = await authService.createUser(input, session.gymId);

  const actor = await userRepository.findById(session.sub);
  await auditService.log({
    gymId: session.gymId,
    actorUserId: session.sub,
    actorName: actor?.name ?? session.email,
    action: "user.create",
    targetType: "user",
    targetId: user.id,
    meta: {
      name: user.name,
      email: user.email,
      role: user.role,
      membershipDays: input.membershipDays,
    },
  });

  return ok({ user }, { status: 201 });
});
