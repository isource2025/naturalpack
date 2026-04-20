"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  History,
  Receipt,
  Wallet,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import SwipeCloseSlider from "./SwipeCloseSlider";
import styles from "./CashView.module.css";

type Summary = {
  periodStart: string | null;
  periodStartLabel: string;
  now: string;
  cashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  lastCloseId: string | null;
};

type Close = {
  id: string;
  closedAt: string;
  periodStart: string | null;
  periodEnd: string;
  cashTotal: number;
  declaredCashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  note: string | null;
  admin: { id: string; name: string } | null;
};

type PaymentSummary = {
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

type DayBucket = {
  date: string;
  payments: PaymentSummary[];
  cashTotal: number;
  cashCount: number;
  totalAll: number;
  allCount: number;
  byMethod: Record<string, { total: number; count: number }>;
};

function ars(n: number) {
  return n.toLocaleString("es-AR");
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

function friendlyDate(iso: string) {
  const parts = iso.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default function CashView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [closes, setCloses] = useState<Close[]>([]);
  const [days, setDays] = useState<DayBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [declaredCash, setDeclaredCash] = useState(0);
  const [closing, setClosing] = useState(false);
  const [swipeResetKey, setSwipeResetKey] = useState(0);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  async function reload() {
    const [sRes, cRes, dRes] = await Promise.all([
      fetch("/api/admin/cash/summary", { cache: "no-store" }),
      fetch("/api/admin/cash/closes?limit=30", { cache: "no-store" }),
      fetch("/api/admin/payments/daily?days=30", { cache: "no-store" }),
    ]);
    const [sBody, cBody, dBody] = await Promise.all([
      sRes.json(),
      cRes.json(),
      dRes.json(),
    ]);
    if (sBody?.ok) setSummary(sBody.data);
    if (cBody?.ok) setCloses(cBody.data.items);
    if (dBody?.ok) setDays(dBody.data.items);
  }

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (summary) {
      setDeclaredCash(summary.cashTotal);
    }
  }, [summary?.cashTotal, summary?.allCount, summary?.periodStart]);

  async function performClose() {
    if (!summary) return;
    setFeedback(null);
    if (summary.cashCount === 0 && summary.allCount === 0) {
      setFeedback({
        kind: "err",
        message: "No hay movimientos pendientes de cerrar.",
      });
      return;
    }
    const declared = Math.round(Number(declaredCash));
    if (!Number.isFinite(declared) || declared < 0) {
      setFeedback({
        kind: "err",
        message: "Ingresá el efectivo contado al cierre (número ≥ 0).",
      });
      return;
    }

    setClosing(true);
    try {
      const res = await fetch("/api/admin/cash/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaredCashTotal: declared,
          note: note.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setFeedback({
          kind: "err",
          message: body.error?.message || "No se pudo cerrar la caja.",
        });
        return;
      }
      setNote("");
      setSwipeResetKey((k) => k + 1);
      setFeedback({
        kind: "ok",
        message: `Caja cerrada. Contaste $${ars(body.data.close.declaredCashTotal)} en efectivo (sistema: $${ars(body.data.close.cashTotal)}).`,
      });
      await reload();
    } catch (err) {
      setFeedback({
        kind: "err",
        message: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setClosing(false);
    }
  }

  function toggleDay(date: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  return (
    <div className={styles.wrap}>
      {/* ---------- Caja abierta ---------- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Wallet size={18} /> Caja abierta
        </h2>
        <p className={styles.cardHint}>
          Resumen del efectivo según tickets desde el último cierre. Antes de
          cerrar, ingresá el efectivo que contaste físicamente y deslizá el
          candado hasta el final para confirmar.
        </p>

        {loading || !summary ? (
          <div className={styles.empty}>Cargando…</div>
        ) : (
          <div className={styles.openBox}>
            <div className={styles.openMain}>
              <span className={styles.openLabel}>Efectivo en caja</span>
              <span className={styles.openAmount}>
                <span className={styles.openAmountCurrency}>$</span>
                {ars(summary.cashTotal)}
              </span>
              <span className={styles.openMeta}>
                {summary.cashCount}{" "}
                {summary.cashCount === 1 ? "ticket" : "tickets"} · Desde{" "}
                <strong>{summary.periodStartLabel}</strong>
              </span>
            </div>
            <div className={styles.openSide}>
              <div className={styles.openRow}>
                <span>Total (todos los métodos)</span>
                <strong>${ars(summary.totalAll)}</strong>
              </div>
              <div className={styles.openRow}>
                <span>Transacciones</span>
                <strong>{summary.allCount}</strong>
              </div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <div className={styles.closeFields}>
            <Input
              label="Efectivo contado al cierre ($)"
              type="number"
              min={0}
              step={100}
              value={declaredCash}
              onChange={(e) => setDeclaredCash(Number(e.target.value))}
              disabled={!summary || loading}
              hint="Coincidir con el arqueo físico. Podés ajustar si difiere del total del sistema."
            />
            <Input
              label="Nota (opcional)"
              placeholder="Ej. arqueo con recepción"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={!summary || loading}
            />
          </div>
          <div className={styles.sliderWrap}>
            <SwipeCloseSlider
              resetKey={swipeResetKey}
              busy={closing}
              disabled={
                !summary ||
                loading ||
                (summary.cashCount === 0 && summary.allCount === 0)
              }
              onComplete={performClose}
            />
          </div>
        </div>

        {feedback?.kind === "ok" && (
          <div className={styles.ok}>
            <CheckCircle2 size={16} />
            <span>{feedback.message}</span>
          </div>
        )}
        {feedback?.kind === "err" && (
          <div className={styles.err}>
            <AlertTriangle size={16} />
            <span>{feedback.message}</span>
          </div>
        )}
      </section>

      {/* ---------- Cierres previos ---------- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <History size={18} /> Cierres anteriores
        </h2>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : closes.length === 0 ? (
          <p className={styles.empty}>Todavía no cerraste caja.</p>
        ) : (
          <ul className={styles.closesList}>
            {closes.map((c) => (
              <li key={c.id} className={styles.closeItem}>
                <div>
                  <div className={styles.closeTop}>
                    {new Date(c.closedAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {c.admin && (
                      <Badge tone="neutral">por {c.admin.name}</Badge>
                    )}
                  </div>
                  <div className={styles.closeMeta}>
                    <span>{c.cashCount} tickets efectivo</span>
                    <span>·</span>
                    <span>{c.allCount} transacciones en total</span>
                    {typeof c.declaredCashTotal === "number" &&
                      c.declaredCashTotal !== c.cashTotal && (
                        <>
                          <span>·</span>
                          <span>
                            Contado ${ars(c.declaredCashTotal)} vs sistema $
                            {ars(c.cashTotal)}
                          </span>
                        </>
                      )}
                    {c.note && (
                      <>
                        <span>·</span>
                        <span>📝 {c.note}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.closeAmount}>
                  <span className={styles.closeAmountMain}>
                    ${ars(c.declaredCashTotal ?? c.cashTotal)}
                  </span>
                  <span className={styles.closeAmountSub}>
                    Sistema ${ars(c.cashTotal)} · Total ${ars(c.totalAll)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Historial por día ---------- */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Receipt size={18} /> Historial por día
        </h2>
        <p className={styles.cardHint}>
          Últimos 30 días. Tocá un día para ver el detalle de cada pago.
        </p>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : days.length === 0 ? (
          <p className={styles.empty}>Sin pagos en los últimos 30 días.</p>
        ) : (
          <div className={styles.dayList}>
            {days.map((day) => {
              const open = openDays.has(day.date);
              return (
                <div key={day.date} className={styles.day}>
                  <button
                    type="button"
                    className={styles.dayHeader}
                    onClick={() => toggleDay(day.date)}
                    aria-expanded={open}
                  >
                    <span
                      className={`${styles.dayCaret} ${open ? styles.dayCaretOpen : ""}`}
                    >
                      <ChevronRight size={16} />
                    </span>
                    <span className={styles.dayLabel}>
                      <span className={styles.dayDate}>
                        {friendlyDate(day.date)}
                      </span>
                      <span className={styles.daySub}>
                        <span>{day.allCount} tickets</span>
                        {day.cashCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{day.cashCount} efectivo</span>
                          </>
                        )}
                      </span>
                    </span>
                    <span className={styles.dayTotals}>
                      <span className={styles.dayCash}>
                        ${ars(day.cashTotal)}
                      </span>
                      <span className={styles.dayAll}>
                        Total ${ars(day.totalAll)}
                      </span>
                    </span>
                  </button>

                  {open && (
                    <div className={styles.dayBody}>
                      <div className={styles.dayMethodChips}>
                        {Object.entries(day.byMethod).map(([method, v]) => (
                          <span key={method} className={styles.chip}>
                            {METHOD_LABEL[method] ?? method}{" "}
                            <strong>${ars(v.total)}</strong>
                            <span>· {v.count}</span>
                          </span>
                        ))}
                      </div>
                      {day.payments.map((p) => (
                        <div key={p.id} className={styles.paymentRow}>
                          <div>
                            <div className={styles.paymentName}>
                              {p.user.name}
                            </div>
                            <div className={styles.paymentMeta}>
                              <span>+{p.days} días</span>
                              <span>·</span>
                              <span>
                                {METHOD_LABEL[p.method] ?? p.method}
                              </span>
                              {p.discount && (
                                <>
                                  <span>·</span>
                                  <span>
                                    🎟 {p.discount.code ?? p.discount.name}
                                  </span>
                                </>
                              )}
                              {p.admin && (
                                <>
                                  <span>·</span>
                                  <span>{p.admin.name}</span>
                                </>
                              )}
                              {p.note && (
                                <>
                                  <span>·</span>
                                  <span>📝 {p.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className={styles.paymentAmount}>
                              ${ars(p.amount)}
                            </div>
                            <div className={styles.paymentTime}>
                              {new Date(p.createdAt).toLocaleTimeString(
                                "es-AR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
