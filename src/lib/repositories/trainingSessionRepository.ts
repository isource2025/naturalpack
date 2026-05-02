import { prisma } from "../db";

export const trainingSessionRepository = {
  upsertToday(data: {
    userId: string;
    gymId?: string | null;
    dayKey: string;
    planKey?: string;
    dayName?: string;
  }) {
    return prisma.trainingSessionCompletion.upsert({
      where: {
        userId_dayKey: {
          userId: data.userId,
          dayKey: data.dayKey,
        },
      },
      create: {
        userId: data.userId,
        gymId: data.gymId ?? null,
        dayKey: data.dayKey,
        planKey: data.planKey,
        dayName: data.dayName,
      },
      update: {
        planKey: data.planKey,
        dayName: data.dayName,
      },
    });
  },
  findByUserAndDay(userId: string, dayKey: string) {
    return prisma.trainingSessionCompletion.findUnique({
      where: { userId_dayKey: { userId, dayKey } },
    });
  },
  completedTimestamps(userId: string, since: Date) {
    return prisma.trainingSessionCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: since },
      },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true },
    });
  },
};
