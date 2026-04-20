import { auditRepository } from "../repositories/auditRepository";

/**
 * Catálogo de acciones auditables. Se usa también como filtro.
 */
export const AUDIT_ACTIONS = [
  "user.create",
  "payment.create",
  "discount.create",
  "discount.update",
  "discount.delete",
  "discount.activate",
  "discount.deactivate",
  "cash.close",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEvent = {
  gymId: string;
  actorUserId: string | null;
  actorName: string; // snapshot
  action: AuditAction;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
};

export const auditService = {
  /** Registra un evento de auditoría. Nunca lanza — la auditoría no debe
   *  romper la operación principal; loggea pero no bloquea. */
  async log(e: AuditEvent) {
    try {
      await auditRepository.create({
        gymId: e.gymId,
        actorUserId: e.actorUserId,
        actorName: e.actorName,
        action: e.action,
        targetType: e.targetType ?? null,
        targetId: e.targetId ?? null,
        meta: e.meta ? JSON.stringify(e.meta) : null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[audit] no se pudo registrar evento", e.action, err);
    }
  },

  async listByGym(
    gymId: string,
    opts: { limit?: number; cursor?: string | null; action?: string | null } = {}
  ) {
    const rows = await auditRepository.listByGym(gymId, opts);
    return rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      actorName: r.actorName,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      createdAt: r.createdAt,
      meta: r.meta ? safeParse(r.meta) : null,
    }));
  },
};

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
