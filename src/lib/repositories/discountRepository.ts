import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export const discountRepository = {
  create(data: Prisma.DiscountUncheckedCreateInput) {
    return prisma.discount.create({ data });
  },

  findById(id: string) {
    return prisma.discount.findUnique({ where: { id } });
  },

  findByGymAndCode(gymId: string, code: string) {
    return prisma.discount.findUnique({
      where: { gymId_code: { gymId, code } },
    });
  },

  listByGym(gymId: string) {
    return prisma.discount.findMany({
      where: { gymId },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  /** Descuentos automáticos vigentes (aplicables ahora). */
  listAutoActive(gymId: string, now: Date = new Date()) {
    return prisma.discount.findMany({
      where: {
        gymId,
        kind: "auto",
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  },

  update(id: string, data: Prisma.DiscountUncheckedUpdateInput) {
    return prisma.discount.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.discount.delete({ where: { id } });
  },

  /** Incrementa el contador de uso (tras registrar un pago). */
  incrementUsage(id: string) {
    return prisma.discount.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  },
};
