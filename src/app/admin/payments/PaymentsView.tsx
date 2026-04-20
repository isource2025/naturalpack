"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Receipt,
  Ticket,
  User as UserIcon,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { isMembershipCritical } from "@/lib/membershipUi";
import styles from "./PaymentsView.module.css";

type ClientItem = {
  id: string;
  name: string;
  email: string;
  membership: { daysRemaining: number; status: string } | null;
};

type PaymentItem = {
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
  discount: { id: string; name: string; code: string | null; kind: string } | null;
};

type Preview =
  | { kind: "idle" }
  | { kind: "checking" }
  | {
      kind: "ok";
      code: string;
      name: string;
      total: number | null;
      discountAmount: number | null;
    }
  | { kind: "invalid"; message: string };

function formatARS(v: number) {
  return `$${v.toLocaleString("es-AR")}`;
}

export default function PaymentsView() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    userId: "",
    listAmount: 0,
    days: 30,
    method: "cash" as "cash" | "transfer" | "card",
    discountCode: "",
    applyAuto: true,
    note: "",
  });
  const [preview, setPreview] = useState<Preview>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          fetch("/api/admin/users?role=client", { cache: "no-store" }),
          fetch("/api/admin/payments?limit=25", { cache: "no-store" }),
        ]);
        const [uBody, pBody] = await Promise.all([uRes.json(), pRes.json()]);
        if (cancelled) return;
        if (uBody?.ok) setClients(uBody.data.items);
        if (pBody?.ok) setPayments(pBody.data.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Validación en vivo del código de descuento (con debounce).
  useEffect(() => {
    const code = form.discountCode.trim().toUpperCase();
    if (!code) {
      setPreview({ kind: "idle" });
      return;
    }
    if (!form.listAmount || form.listAmount <= 0) {
      setPreview({ kind: "idle" });
      return;
    }
    setPreview({ kind: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/discounts/validate?code=${encodeURIComponent(code)}&amount=${form.listAmount}`,
          { signal: ctrl.signal }
        );
        const body = await res.json();
        if (body?.ok) {
          setPreview({
            kind: "ok",
            code: body.data.code,
            name: body.data.name,
            total: body.data.total,
            discountAmount: body.data.discountAmount,
          });
        } else {
          setPreview({
            kind: "invalid",
            message: body?.error?.message || "Código inválido",
          });
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setPreview({ kind: "invalid", message: "No se pudo validar el código" });
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [form.discountCode, form.listAmount]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.userId) ?? null,
    [clients, form.userId]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!form.userId) {
      setFeedback({ kind: "err", message: "Elegí un socio" });
      return;
    }
    if (form.listAmount <= 0) {
      setFeedback({ kind: "err", message: "Ingresá un monto mayor a 0" });
      return;
    }
    if (form.days <= 0) {
      setFeedback({ kind: "err", message: "Días mayor a 0" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          listAmount: form.listAmount,
          days: form.days,
          method: form.method,
          discountCode: form.discountCode || undefined,
          applyAuto: form.applyAuto,
          note: form.note || undefined,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setFeedback({
          kind: "err",
          message: body.error?.message || "No se pudo registrar el pago",
        });
        return;
      }
      setFeedback({
        kind: "ok",
        message: `Pago registrado. Se agregaron ${form.days} días.`,
      });
      // reset parcial
      setForm((f) => ({
        ...f,
        listAmount: 0,
        discountCode: "",
        note: "",
      }));
      setPreview({ kind: "idle" });
      // Recargamos listas.
      const [uRes, pRes] = await Promise.all([
        fetch("/api/admin/users?role=client", { cache: "no-store" }),
        fetch("/api/admin/payments?limit=25", { cache: "no-store" }),
      ]);
      const [uBody, pBody] = await Promise.all([uRes.json(), pRes.json()]);
      if (uBody?.ok) setClients(uBody.data.items);
      if (pBody?.ok) setPayments(pBody.data.items);
    } catch (err) {
      setFeedback({
        kind: "err",
        message: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Preview total a pagar: si hay código válido → usa eso; si no,
  // mostramos el listAmount (el auto se resuelve recién en el server).
  const showDiscount = preview.kind === "ok" && preview.discountAmount != null;
  const total =
    preview.kind === "ok" && preview.total != null ? preview.total : form.listAmount;

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Receipt size={18} /> Registrar pago
        </h2>
        <p className={styles.cardHint}>
          Aceptá el pago, elegí los días y quedará registrado en auditoría
          automáticamente. Si aplicás un descuento por código, se valida al
          tipear.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.fieldWrap}>
            <label className={styles.label} htmlFor="pay-user">
              Socio
            </label>
            <select
              id="pay-user"
              className={styles.select}
              value={form.userId}
              onChange={(e) => update("userId", e.target.value)}
              required
            >
              <option value="">Elegí un socio…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                  {c.membership
                    ? ` (${c.membership.daysRemaining}d)`
                    : ""}
                </option>
              ))}
            </select>
            {selectedClient && (
              <div style={{ marginTop: 4 }}>
                <Badge
                  tone={
                    selectedClient.membership?.status === "active"
                      ? isMembershipCritical(
                          selectedClient.membership.daysRemaining
                        )
                        ? "danger"
                        : "success"
                      : "danger"
                  }
                  dot
                >
                  {selectedClient.membership
                    ? isMembershipCritical(
                        selectedClient.membership.daysRemaining
                      )
                      ? `⚠️ ${selectedClient.membership.daysRemaining} días — renovación urgente`
                      : `${selectedClient.membership.daysRemaining} días restantes`
                    : "Sin membresía"}
                </Badge>
              </div>
            )}
          </div>

          <div className={styles.grid2}>
            <Input
              label="Monto de lista"
              type="number"
              min={1}
              value={form.listAmount || ""}
              onChange={(e) => update("listAmount", Number(e.target.value))}
              placeholder="15000"
              leftIcon={<DollarSign size={16} />}
              required
            />
            <Input
              label="Días a agregar"
              type="number"
              min={1}
              max={3650}
              value={form.days}
              onChange={(e) => update("days", Number(e.target.value))}
              required
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldWrap}>
              <label className={styles.label} htmlFor="pay-method">
                Medio de pago
              </label>
              <select
                id="pay-method"
                className={styles.select}
                value={form.method}
                onChange={(e) =>
                  update("method", e.target.value as typeof form.method)
                }
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            <Input
              label="Código de descuento (opcional)"
              type="text"
              value={form.discountCode}
              onChange={(e) =>
                update("discountCode", e.target.value.toUpperCase())
              }
              placeholder="VERANO20"
              leftIcon={<Ticket size={16} />}
              hint={
                preview.kind === "checking"
                  ? "Validando…"
                  : preview.kind === "invalid"
                  ? preview.message
                  : preview.kind === "ok"
                  ? `✓ ${preview.name}`
                  : undefined
              }
              error={preview.kind === "invalid" ? preview.message : undefined}
            />
          </div>

          <Input
            label="Nota (opcional)"
            type="text"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="Pago mes de abril"
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--muted)",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="checkbox"
              checked={form.applyAuto}
              onChange={(e) => update("applyAuto", e.target.checked)}
            />
            Aplicar descuentos automáticos vigentes si no se ingresa código
          </label>

          {form.listAmount > 0 && (
            <div
              className={`${styles.summary} ${showDiscount ? styles.withDiscount : ""}`}
            >
              <div className={styles.summaryLeft}>
                <div className={styles.summaryLine1}>
                  Total a cobrar
                  {showDiscount && preview.kind === "ok" && (
                    <Badge tone="brand">
                      -{formatARS(preview.discountAmount ?? 0)}
                    </Badge>
                  )}
                </div>
                <div className={styles.summaryDetail}>
                  {showDiscount ? (
                    <>
                      <span className={styles.strike}>
                        {formatARS(form.listAmount)}
                      </span>
                      {" · "}
                      <span>
                        {preview.kind === "ok" ? preview.name : null}
                      </span>
                    </>
                  ) : (
                    "Sin descuento por código · los automáticos se aplican al confirmar"
                  )}
                </div>
              </div>
              <div className={styles.summaryTotal}>{formatARS(total)}</div>
            </div>
          )}

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

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            leftIcon={<CreditCard size={18} />}
          >
            {submitting ? "Registrando…" : "Aceptar pago"}
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Receipt size={18} /> Últimos pagos
        </h2>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : payments.length === 0 ? (
          <p className={styles.empty}>Todavía no hay pagos registrados.</p>
        ) : (
          <ul className={styles.list}>
            {payments.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemName}>
                    <UserIcon
                      size={13}
                      style={{ display: "inline", marginRight: 4 }}
                    />
                    {p.user.name}
                  </div>
                  <div className={styles.itemMeta}>
                    <span>+{p.days} días</span>
                    <span>·</span>
                    <span>{p.method === "cash" ? "Efectivo" : p.method}</span>
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
                        <span>Aceptó: {p.admin.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <div className={styles.itemAmount}>
                    {formatARS(p.amount)}
                  </div>
                  <div className={styles.itemDate}>
                    {new Date(p.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
