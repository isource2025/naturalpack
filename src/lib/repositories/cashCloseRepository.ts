import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export const cashCloseRepository = {
  create(data: Prisma.CashCloseUncheckedCreateInput) {
    return prisma.cashClose.create({ data });
  },
  findLastForGym(gymId: string) {
    return prisma.cashClose.findFirst({
      where: { gymId },
      orderBy: { closedAt: "desc" },
    });
  },
  listByGym(gymId: string, limit = 50) {
    return prisma.cashClose.findMany({
      where: { gymId },
      orderBy: { closedAt: "desc" },
      take: limit,
      include: {
        admin: { select: { id: true, name: true } },
      },
    });
  },
};
