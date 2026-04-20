import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export const paymentRepository = {
  create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  },

  /** Lista paginada por cursor. */
  listByGym(gymId: string, opts: { limit?: number; cursor?: string | null } = {}) {
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    return prisma.payment.findMany({
      where: { gymId },
      orderBy: { createdAt: "desc" },
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      include: {
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true } },
        discount: { select: { id: true, name: true, code: true, kind: true } },
      },
    });
  },

  listByUser(userId: string, limit = 20) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        admin: { select: { id: true, name: true } },
        discount: { select: { id: true, name: true, code: true } },
      },
    });
  },

  countForGym(gymId: string) {
    return prisma.payment.count({ where: { gymId } });
  },

  /**
   * Pagos del gym dentro de un rango de fechas (cerrado por ambos lados).
   * `start` puede ser null → desde el inicio.
   * Devuelve el detalle completo; las agregaciones (totales por método,
   * agrupación por día) se hacen en el service para respetar la TZ local.
   */
  listInRange(
    gymId: string,
    start: Date | null,
    end: Date
  ) {
    return prisma.payment.findMany({
      where: {
        gymId,
        createdAt: {
          ...(start ? { gt: start } : {}),
          lte: end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true } },
        discount: { select: { id: true, name: true, code: true, kind: true } },
      },
    });
  },
};
