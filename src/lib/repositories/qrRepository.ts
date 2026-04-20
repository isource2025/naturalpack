import { prisma } from "../db";

export const qrRepository = {
  findByCode(code: string) {
    return prisma.qRCode.findUnique({
      where: { code },
      include: {
        user: {
          include: {
            memberships: { orderBy: { endDate: "desc" }, take: 1 },
          },
        },
      },
    });
  },
  findActiveByUser(userId: string) {
    return prisma.qRCode.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
  },
  create(userId: string, code: string) {
    return prisma.qRCode.create({ data: { userId, code } });
  },
};
