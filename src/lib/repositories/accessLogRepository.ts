import { prisma } from "../db";

export const accessLogRepository = {
  create(data: {
    userId?: string | null;
    gymId?: string | null;
    status: "granted" | "denied";
    reason?: string | null;
  }) {
    return prisma.accessLog.create({ data });
  },
  recentForGym(gymId: string, limit = 20) {
    return prisma.accessLog.findMany({
      where: { gymId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { user: true },
    });
  },
  /**
   * Lista paginada por cursor para el módulo "Accesos" del admin.
   * Se filtra por el gymId del admin para no cruzar tenants.
   */
  listByGym(gymId: string, opts: { limit?: number; cursor?: string | null } = {}) {
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    return prisma.accessLog.findMany({
      where: { gymId },
      orderBy: { timestamp: "desc" },
      take,
      ...(opts.cursor
        ? { skip: 1, cursor: { id: opts.cursor } }
        : {}),
      include: {
        user: {
          select: { id: true, name: true, email: true, photoUrl: true },
        },
      },
    });
  },
  /** Historial reciente de un socio puntual (panel de detalle). */
  recentForUser(userId: string, limit = 20) {
    return prisma.accessLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  },

  /**
   * Timestamps de accesos "granted" del socio dentro de una ventana.
   * El servicio de racha los agrupa por día/semana para calcular la racha.
   */
  grantedTimestamps(userId: string, since: Date) {
    return prisma.accessLog.findMany({
      where: {
        userId,
        status: "granted",
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
    });
  },
};
