import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireSuperadmin } from "@/lib/auth";
import { GymCreateDTO } from "@/lib/dtos";
import { ConflictError } from "@/lib/errors";
import { gymRepository } from "@/lib/repositories/gymRepository";
import { platformPaymentRepository } from "@/lib/repositories/platformPaymentRepository";
import { slugifyGym } from "@/lib/services/authService";

export const runtime = "nodejs";

/**
 * GET /api/platform/gyms
 *
 * Lista todos los gimnasios de la plataforma con stats agregadas para el
 * dashboard del superadmin. Incluye un pequeño resumen total (gyms por
 * estado, total recaudado por la plataforma).
 */
export const GET = handle(async () => {
  requireSuperadmin();
  const [gyms, totals] = await Promise.all([
    gymRepository.listAllWithStats(),
    platformPaymentRepository.totalCollected(),
  ]);

  const summary = {
    totalGyms: gyms.length,
    activeGyms: gyms.filter((g) => g.status === "active").length,
    trialGyms: gyms.filter((g) => g.status === "trial").length,
    suspendedGyms: gyms.filter((g) => g.status === "suspended").length,
    platformRevenue: totals.total,
    platformPaymentsCount: totals.count,
  };

  return ok({ items: gyms, summary });
});

/**
 * POST /api/platform/gyms
 *
 * Crea un gimnasio manualmente desde el superadmin (útil para onboarding
 * asistido o seed de datos). El owner del gym se agrega después via
 * /register o manualmente desde /admin/users (requiere un admin logueado
 * en el gym, por eso normalmente el flujo recomendado es /register?as=owner).
 */
export const POST = handle(async (req: NextRequest) => {
  requireSuperadmin();
  const body = await req.json();
  const input = GymCreateDTO.parse(body);

  const slug = input.slug ? input.slug : slugifyGym(input.name);
  const existing = await gymRepository.findBySlug(slug);
  if (existing) {
    throw new ConflictError(
      `Ya existe un gimnasio con el código "${slug}". Prueba otro nombre o especifica un slug distinto.`
    );
  }

  const trialEndsAt =
    input.status === "trial" && input.trialEndsAt
      ? new Date(input.trialEndsAt)
      : null;

  const gym = await gymRepository.create({
    name: input.name,
    slug,
    status: input.status,
    trialEndsAt,
  });

  return ok({ gym }, { status: 201 });
});
