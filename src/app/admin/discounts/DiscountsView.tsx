"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  Plus,
  Power,
  Shuffle,
  Tag,
  Ticket,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import styles from "./DiscountsView.module.css";

type Discount = {
  id: string;
  name: string;
  kind: "auto" | "code";
  code: string | null;
  percentOff: number | null;
  amountOff: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
};

export default function DiscountsView() {
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    kind: "auto" as "auto" | "code",
    code: "",
    kindValue: "percent" as "percent" | "amount",
    percentOff: 10,
    amountOff: 1000,
    active: true,
    usageLimit: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
    | null
  >(null);

  async function reload() {
    const res = await fetch("/api/admin/discounts", { cache: "no-store" });
    const body = await res.json();
    if (body?.ok) setItems(body.data.items);
  }

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, []);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  /** 5 letras A–Z + 2 dígitos, todo mayúsculas y sin espacios (ej. QRTXP07). */
  function randomDiscountName() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let s = "";
    for (let i = 0; i < 5; i++) {
      s += letters[Math.floor(Math.random() * letters.length)]!;
    }
    const n = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    update("name", `${s}${n}`);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (form.kind === "code" && !form.code.trim()) {
      setFeedback({ kind: "err", message: "Los descuentos por código necesitan un code" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        kind: form.kind,
        ...(form.kind === "code" ? { code: form.code.trim().toUpperCase() } : {}),
        ...(form.kindValue === "percent"
          ? { percentOff: form.percentOff }
          : { amountOff: form.amountOff }),
        active: form.active,
        ...(form.usageLimit > 0 ? { usageLimit: form.usageLimit } : {}),
      };
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!body.ok) {
        setFeedback({
          kind: "err",
          message: body.error?.message || "No se pudo crear el descuento",
        });
        return;
      }
      setFeedback({ kind: "ok", message: "Descuento creado" });
      setForm((f) => ({ ...f, name: "", code: "" }));
      await reload();
    } catch (err) {
      setFeedback({
        kind: "err",
        message: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(d: Discount) {
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    await reload();
  }

  async function remove(d: Discount) {
    if (!confirm(`¿Eliminar descuento "${d.name}"? Los pagos previos lo conservan registrado.`)) return;
    await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Plus size={18} /> Nuevo descuento
        </h2>
        <p className={styles.cardHint}>
          Los <strong>automáticos</strong> se aplican solos al cobrar (se usa el
          mejor vigente). Los de <strong>código</strong> requieren que el admin
          o el socio lo ingresen.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.nameInputBlock}>
            <div className={styles.nameHead}>
              <label className={styles.label} htmlFor="disc-name">
                Nombre
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Shuffle size={14} />}
                onClick={randomDiscountName}
              >
                Random
              </Button>
            </div>
            <Input
              id="disc-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Promo verano"
              leftIcon={<Tag size={16} />}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldWrap}>
              <label className={styles.label} htmlFor="d-kind">
                Tipo
              </label>
              <select
                id="d-kind"
                className={styles.select}
                value={form.kind}
                onChange={(e) => update("kind", e.target.value as "auto" | "code")}
              >
                <option value="auto">Automático (aplica siempre)</option>
                <option value="code">Por código único</option>
              </select>
            </div>
            {form.kind === "code" ? (
              <Input
                label="Código"
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  update("code", e.target.value.toUpperCase())
                }
                placeholder="VERANO20"
                leftIcon={<Ticket size={16} />}
                hint="Solo letras, números, _ o -"
              />
            ) : (
              <div />
            )}
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldWrap}>
              <label className={styles.label} htmlFor="d-kindval">
                Tipo de descuento
              </label>
              <select
                id="d-kindval"
                className={styles.select}
                value={form.kindValue}
                onChange={(e) =>
                  update(
                    "kindValue",
                    e.target.value as "percent" | "amount"
                  )
                }
              >
                <option value="percent">Porcentaje %</option>
                <option value="amount">Monto fijo $</option>
              </select>
            </div>
            {form.kindValue === "percent" ? (
              <Input
                label="% de descuento"
                type="number"
                min={1}
                max={100}
                value={form.percentOff}
                onChange={(e) => update("percentOff", Number(e.target.value))}
                leftIcon={<Percent size={16} />}
                required
              />
            ) : (
              <Input
                label="$ de descuento"
                type="number"
                min={1}
                value={form.amountOff}
                onChange={(e) => update("amountOff", Number(e.target.value))}
                required
              />
            )}
          </div>

          <Input
            label="Límite de usos (opcional)"
            type="number"
            min={0}
            value={form.usageLimit || ""}
            onChange={(e) => update("usageLimit", Number(e.target.value))}
            placeholder="0 = sin límite"
            hint="Cada pago que aplique este descuento (automático o por código) suma 1 uso. Al llegar al límite, deja de aplicarse solo."
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
              checked={form.active}
              onChange={(e) => update("active", e.target.checked)}
            />
            Activo desde ya
          </label>

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
            leftIcon={<Plus size={18} />}
          >
            {submitting ? "Creando…" : "Crear descuento"}
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          <Ticket size={18} /> Descuentos existentes
        </h2>
        {loading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Todavía no creaste descuentos.</p>
        ) : (
          <div className={styles.list}>
            {items.map((d) => (
              <div
                key={d.id}
                className={`${styles.item} ${!d.active ? styles.inactive : ""}`}
              >
                <div>
                  <div className={styles.itemHeader}>
                    <span className={styles.name}>{d.name}</span>
                    <Badge tone={d.kind === "code" ? "brand" : "neutral"}>
                      {d.kind === "code" ? "Código" : "Auto"}
                    </Badge>
                    {d.code && <span className={styles.code}>{d.code}</span>}
                    {d.percentOff != null && <Badge tone="warn">-{d.percentOff}%</Badge>}
                    {d.amountOff != null && <Badge tone="warn">-${d.amountOff.toLocaleString("es-AR")}</Badge>}
                  </div>
                  <div className={styles.meta}>
                    <span>Usos: {d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}</span>
                    <span>·</span>
                    <span>
                      Creado: {new Date(d.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${d.active ? styles.on : ""}`}
                    onClick={() => toggle(d)}
                    aria-label={d.active ? "Desactivar" : "Activar"}
                  >
                    <Power size={13} />
                    {d.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => remove(d)}
                    aria-label="Eliminar descuento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
