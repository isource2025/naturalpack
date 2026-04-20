import { prisma } from "../db";
import type { PlatformPaymentMethod } from "../dtos";

/**
 * Pagos que los dueños de gym le hacen a la plataforma (NaturalPack).
 * Se crean desde /platform. Cuando sumemos pasarela, los creará el webhook.
 */
export const platformPaymentRepository = {
  listByGym(gymId: string) {
    return prisma.platformPayment.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });
  },

  listAll(limit = 100) {
    return prisma.platformPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        gym: { select: { id: true, name: true, slug: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    });
  },

  create(input: {
    gymId: string;
    amount: number;
    method: PlatformPaymentMethod;
    periodStart?: Date;
    periodEnd?: Date;
    note?: string;
    recordedByUserId: string;
  }) {
    return prisma.platformPayment.create({
      data: {
        gymId: input.gymId,
        amount: input.amount,
        method: input.method,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        note: input.note,
        recordedByUserId: input.recordedByUserId,
      },
    });
  },

  /** Suma total recaudada por la plataforma (para el header del dashboard). */
  async totalCollected() {
    const agg = await prisma.platformPayment.aggregate({
      _sum: { amount: true },
      _count: true,
    });
    return {
      total: agg._sum.amount ?? 0,
      count: agg._count,
    };
  },
};
