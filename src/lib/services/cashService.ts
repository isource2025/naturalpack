import { ValidationError } from "../errors";
import { paymentRepository } from "../repositories/paymentRepository";
import { cashCloseRepository } from "../repositories/cashCloseRepository";

export type OpenCashSummary = {
  periodStart: string | null;
  periodStartLabel: string; // human label, p. ej. "desde el inicio"
  now: string;
  cashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  lastCloseId: string | null;
};

export type CashCloseDTO = {
  id: string;
  closedAt: string;
  periodStart: string | null;
  periodEnd: string;
  cashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  /** Efectivo contado físicamente al cerrar. */
  declaredCashTotal: number;
  note: string | null;
  admin: { id: string; name: string } | null;
};

export type PaymentSummary = {
  id: string;
  amount: number;
  listAmount: number;
  discountAmount: number | null;
  days: number;
  method: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  admin: { id: string; name: string } | null;
  discount: { id: string; name: string; code: string | null } | null;
};

export type DayBucket = {
  /** YYYY-MM-DD (local time). */
  date: string;
  payments: PaymentSummary[];
  cashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  byMethod: Record<string, { total: number; count: number }>;
};

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfLocalDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export const cashService = {
  /** Resumen del período de caja abierto (desde el último cierre, o desde el inicio). */
  async getOpenSummary(gymId: string, now: Date = new Date()): Promise<OpenCashSummary> {
    const last = await cashCloseRepository.findLastForGym(gymId);
    const start = last ? last.closedAt : null;
    const payments = await paymentRepository.listInRange(gymId, start, now);
    let cashTotal = 0;
    let cashCount = 0;
    let totalAll = 0;
    for (const p of payments) {
      totalAll += p.amount;
      if (p.method === "cash") {
        cashTotal += p.amount;
        cashCount += 1;
      }
    }
    return {
      periodStart: start ? start.toISOString() : null,
      periodStartLabel: start
        ? start.toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "desde el inicio",
      now: now.toISOString(),
      cashTotal,
      cashCount,
      totalAll,
      allCount: payments.length,
      lastCloseId: last?.id ?? null,
    };
  },

  /**
   * Cierra la caja: toma el snapshot actual y persiste un CashClose.
   * Devuelve el cierre creado (con resumen).
   */
  async close(
    gymId: string,
    adminId: string,
    declaredCashTotal: number,
    note?: string | null,
    now: Date = new Date()
  ) {
    if (!Number.isFinite(declaredCashTotal) || declaredCashTotal < 0) {
      throw new ValidationError("El monto de cierre debe ser un número ≥ 0");
    }
    const summary = await this.getOpenSummary(gymId, now);
    const created = await cashCloseRepository.create({
      gymId,
      adminId,
      closedAt: now,
      periodStart: summary.periodStart ? new Date(summary.periodStart) : null,
      periodEnd: now,
      cashTotal: summary.cashTotal,
      cashCount: summary.cashCount,
      totalAll: summary.totalAll,
      allCount: summary.allCount,
      declaredCashTotal: Math.round(declaredCashTotal),
      note: note ?? null,
    });
    return created;
  },

  async listCloses(gymId: string, limit = 50): Promise<CashCloseDTO[]> {
    const rows = await cashCloseRepository.listByGym(gymId, limit);
    return rows.map((r) => ({
      id: r.id,
      closedAt: r.closedAt.toISOString(),
      periodStart: r.periodStart ? r.periodStart.toISOString() : null,
      periodEnd: r.periodEnd.toISOString(),
      cashTotal: r.cashTotal,
      cashCount: r.cashCount,
      totalAll: r.totalAll,
      allCount: r.allCount,
      declaredCashTotal: r.declaredCashTotal,
      note: r.note,
      admin: r.admin,
    }));
  },

  /**
   * Historial de pagos agrupados por día (TZ local). Incluye todos los
   * pagos (no sólo efectivo) y un detalle completo por día. El cliente
   * puede mostrarlos colapsados y expandir el detalle al tap.
   */
  async dailyHistory(
    gymId: string,
    opts: { from?: Date; to?: Date; days?: number } = {}
  ): Promise<DayBucket[]> {
    const now = new Date();
    const to = opts.to ? endOfLocalDay(opts.to) : endOfLocalDay(now);
    // por defecto: últimos 30 días
    const daysWindow = opts.days ?? 30;
    const from = opts.from
      ? startOfLocalDay(opts.from)
      : (() => {
          const d = new Date(to);
          d.setDate(d.getDate() - (daysWindow - 1));
          d.setHours(0, 0, 0, 0);
          return d;
        })();

    // Usamos `listInRange` con un `start` un ms antes de `from` para que `gt`
    // se comporte como `gte`.
    const startExclusive = new Date(from.getTime() - 1);
    const rows = await paymentRepository.listInRange(gymId, startExclusive, to);

    const byDay = new Map<string, DayBucket>();
    for (const p of rows) {
      const key = localDayKey(p.createdAt);
      let bucket = byDay.get(key);
      if (!bucket) {
        bucket = {
          date: key,
          payments: [],
          cashTotal: 0,
          cashCount: 0,
          totalAll: 0,
          allCount: 0,
          byMethod: {},
        };
        byDay.set(key, bucket);
      }
      bucket.payments.push({
        id: p.id,
        amount: p.amount,
        listAmount: p.listAmount,
        discountAmount: p.discountAmount,
        days: p.days,
        method: p.method,
        note: p.note,
        createdAt: p.createdAt.toISOString(),
        user: p.user,
        admin: p.admin,
        discount: p.discount
          ? { id: p.discount.id, name: p.discount.name, code: p.discount.code }
          : null,
      });
      bucket.totalAll += p.amount;
      bucket.allCount += 1;
      if (p.method === "cash") {
        bucket.cashTotal += p.amount;
        bucket.cashCount += 1;
      }
      const m = bucket.byMethod[p.method] ?? { total: 0, count: 0 };
      m.total += p.amount;
      m.count += 1;
      bucket.byMethod[p.method] = m;
    }

    // Orden descendente por fecha.
    return Array.from(byDay.values()).sort((a, b) =>
      a.date < b.date ? 1 : -1
    );
  },
};
