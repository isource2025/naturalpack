import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

export const auditRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  /** Lista paginada por cursor para el viewer del admin. */
  listByGym(
    gymId: string,
    opts: {
      limit?: number;
      cursor?: string | null;
      action?: string | null;
    } = {}
  ) {
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    return prisma.auditLog.findMany({
      where: {
        gymId,
        ...(opts.action ? { action: opts.action } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
    });
  },
};
