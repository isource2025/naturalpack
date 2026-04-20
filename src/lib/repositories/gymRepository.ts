import { prisma } from "../db";
import type { GymStatusT } from "../dtos";

export const gymRepository = {
  findBySlug(slug: string) {
    return prisma.gym.findUnique({ where: { slug } });
  },
  findById(id: string) {
    return prisma.gym.findUnique({ where: { id } });
  },
  /** Crea un gimnasio nuevo; falla si el slug ya existe (a chequear antes). */
  create(input: {
    slug: string;
    name: string;
    status?: GymStatusT;
    trialEndsAt?: Date | null;
  }) {
    return prisma.gym.create({
      data: {
        slug: input.slug,
        name: input.name,
        status: input.status ?? "active",
        trialEndsAt: input.trialEndsAt ?? null,
      },
    });
  },
  delete(id: string) {
    return prisma.gym.delete({ where: { id } });
  },
  upsertDefault(slug: string, name: string) {
    return prisma.gym.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
    });
  },
  updateStatus(id: string, status: GymStatusT, trialEndsAt?: Date | null) {
    return prisma.gym.update({
      where: { id },
      data: {
        status,
        ...(trialEndsAt !== undefined ? { trialEndsAt } : {}),
      },
    });
  },
  /**
   * Lista todos los gimnasios con contadores para la vista /platform. No es
   * una query pesada: usa _count de Prisma + último PlatformPayment.
   */
  async listAllWithStats() {
    const gyms = await prisma.gym.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: {
            users: true,
            payments: true,
            platformPayments: true,
          },
        },
        platformPayments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            amount: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });
    return gyms.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      status: g.status as GymStatusT,
      trialEndsAt: g.trialEndsAt,
      createdAt: g.createdAt,
      usersCount: g._count.users,
      paymentsCount: g._count.payments,
      platformPaymentsCount: g._count.platformPayments,
      lastPlatformPayment: g.platformPayments[0] ?? null,
    }));
  },
};
