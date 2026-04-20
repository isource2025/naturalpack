import { prisma } from "../db";

const DAY_MS = 24 * 60 * 60 * 1000;

export const membershipRepository = {
  latestForUser(userId: string) {
    return prisma.membership.findFirst({
      where: { userId },
      orderBy: { endDate: "desc" },
    });
  },
  create(userId: string, days: number) {
    const now = new Date();
    const end = new Date(now.getTime() + days * DAY_MS);
    return prisma.membership.create({
      data: { userId, status: "active", startDate: now, endDate: end },
    });
  },
  /**
   * Agrega `days` a la membresía del usuario. Si la última sigue vigente,
   * extiende su endDate. Si está vencida o no existe, crea una nueva que
   * arranca hoy.
   */
  async addDays(userId: string, days: number) {
    if (days <= 0) {
      throw new Error("days debe ser > 0");
    }
    const now = new Date();
    const latest = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { endDate: "desc" },
    });
    if (latest && latest.endDate > now) {
      return prisma.membership.update({
        where: { id: latest.id },
        data: {
          status: "active",
          endDate: new Date(latest.endDate.getTime() + days * DAY_MS),
        },
      });
    }
    return prisma.membership.create({
      data: {
        userId,
        status: "active",
        startDate: now,
        endDate: new Date(now.getTime() + days * DAY_MS),
      },
    });
  },
};
