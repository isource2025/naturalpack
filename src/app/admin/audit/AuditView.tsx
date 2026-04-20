"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import styles from "./AuditView.module.css";

type AuditItem = {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  meta: unknown;
};

/** Texto principal de la línea (sin códigos técnicos). */
const ACTION_LABELS: Record<string, string> = {
  "user.create": "Creó un socio",
  "payment.create": "Registró un pago",
  "discount.create": "Creó un descuento",
  "discount.update": "Editó un descuento",
  "discount.delete": "Eliminó un descuento",
  "discount.activate": "Activó un descuento",
  "discount.deactivate": "Desactivó un descuento",
  "cash.close": "Cerró caja",
};

const ACTION_GROUPS: Record<string, string> = {
  "user.create": "user",
  "payment.create": "payment",
  "discount.create": "discount",
  "discount.update": "discount",
  "discount.delete": "discount",
  "discount.activate": "discount",
  "discount.deactivate": "discount",
  "cash.close": "cash",
};

/** Etiqueta corta para el chip junto al nombre (usuario final). */
const CATEGORY_LABEL: Record<string, string> = {
  user: "Socio",
  payment: "Pago",
  discount: "Descuento",
  cash: "Caja",
};

function summarize(item: AuditItem): string {
  const m = item.meta as Record<string, unknown> | null;
  if (!m) return "";
  switch (item.action) {
    case "user.create":
      return `${m.name} (${m.email}) · ${formatRole(m.role)} · ${m.membershipDays} días de membresía`;
    case "payment.create":
      return `${m.userName ?? ""} · +${m.days} días · ${formatMoney(m.amount)}${
        m.discountCode ? ` · cupón ${m.discountCode}` : ""
      } · ${formatMethod(m.method)}`;
    case "discount.create":
      return `${m.name}${m.code ? ` · código ${m.code}` : ""} · ${discountValueLine(m)} · ${formatKind(m.kind)}`;
    case "discount.update":
      return `${m.name}${m.code ? ` · código ${m.code}` : ""}`;
    case "discount.delete":
      return `${m.name ?? "(sin nombre)"}${m.code ? ` · código ${m.code}` : ""}`;
    case "discount.activate":
    case "discount.deactivate":
      return `${m.name}${m.code ? ` · código ${m.code}` : ""}`;
    case "cash.close": {
      const sys = formatMoney(m.cashTotal);
      const dec =
        m.declaredCashTotal != null && typeof m.declaredCashTotal === "number"
          ? formatMoney(m.declaredCashTotal)
          : sys;
      const diff =
        m.declaredCashTotal != null &&
        typeof m.declaredCashTotal === "number" &&
        m.declaredCashTotal !== m.cashTotal;
      return diff
        ? `Contaste ${dec} · sistema ${sys} (${m.cashCount} tickets efectivo) · total movimientos ${formatMoney(m.totalAll)}`
        : `Efectivo ${sys} (${m.cashCount} en efectivo) · total ${formatMoney(m.totalAll)}`;
    }
    default:
      return "";
  }
}

function formatMoney(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("es-AR")}`;
}

function formatMethod(m: unknown): string {
  if (m === "cash") return "Efectivo";
  if (m === "transfer") return "Transferencia";
  if (m === "card") return "Tarjeta";
  return typeof m === "string" && m ? m : "—";
}

function formatRole(r: unknown): string {
  if (r === "client") return "Cliente";
  if (r === "admin") return "Administrador";
  return typeof r === "string" && r ? r : "—";
}

function formatKind(k: unknown): string {
  if (k === "auto") return "Automático al cobrar";
  if (k === "code") return "Por código";
  return typeof k === "string" && k ? k : "—";
}

function formatYesNo(v: unknown): string {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return "—";
}

function formatDateTime(s: unknown): string {
  if (typeof s !== "string") return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function discountValueLine(m: Record<string, unknown>): string {
  if (m.percentOff != null && typeof m.percentOff === "number")
    return `-${m.percentOff}%`;
  if (m.amountOff != null && typeof m.amountOff === "number")
    return `-${formatMoney(m.amountOff)}`;
  return "—";
}

const CHANGE_FIELD_LABELS: Record<string, string> = {
  name: "Nombre del descuento",
  code: "Código",
  percentOff: "Porcentaje de descuento",
  amountOff: "Monto fijo de descuento",
  active: "Activo",
  startsAt: "Vigente desde",
  endsAt: "Vigente hasta",
  usageLimit: "Límite de usos",
};

function formatChangeValue(key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (key === "active") return formatYesNo(v);
  if (key === "startsAt" || key === "endsAt") return formatDateTime(v);
  if (key === "percentOff" && typeof v === "number") return `${v}%`;
  if (key === "amountOff" && typeof v === "number") return formatMoney(v);
  if (key === "usageLimit") {
    if (typeof v === "number" && v === 0) return "Sin límite";
    return String(v);
  }
  return typeof v === "object" ? "—" : String(v);
}

type DetailRow = { label: string; value: string };

/**
 * Traduce el meta del evento a filas legibles (sin JSON ni claves técnicas).
 */
function metaToDetailRows(action: string, meta: unknown): DetailRow[] {
  if (meta == null || typeof meta !== "object") return [];
  const m = meta as Record<string, unknown>;

  switch (action) {
    case "payment.create":
      return [
        { label: "Socio", value: String(m.userName ?? "—") },
        { label: "Medio de pago", value: formatMethod(m.method) },
        { label: "Días sumados a la membresía", value: String(m.days ?? "—") },
        { label: "Monto cobrado", value: formatMoney(m.amount) },
        { label: "Precio de lista", value: formatMoney(m.listAmount) },
        {
          label: "Ahorro por descuento",
          value:
            m.discountAmount != null && typeof m.discountAmount === "number"
              ? formatMoney(m.discountAmount)
              : "Ninguno",
        },
        {
          label: "Cupón usado",
          value: m.discountCode ? String(m.discountCode) : "No se usó cupón",
        },
      ];

    case "user.create":
      return [
        { label: "Nombre", value: String(m.name ?? "—") },
        { label: "Correo", value: String(m.email ?? "—") },
        { label: "Tipo de cuenta", value: formatRole(m.role) },
        {
          label: "Días de membresía al dar de alta",
          value: String(m.membershipDays ?? "—"),
        },
      ];

    case "discount.create":
      return [
        { label: "Nombre de la promo", value: String(m.name ?? "—") },
        { label: "Cómo se aplica", value: formatKind(m.kind) },
        {
          label: "Código",
          value: m.code ? String(m.code) : "No aplica (solo automático)",
        },
        {
          label: "Beneficio",
          value:
            m.percentOff != null && typeof m.percentOff === "number"
              ? `${m.percentOff}% menos sobre el monto`
              : m.amountOff != null && typeof m.amountOff === "number"
                ? `${formatMoney(m.amountOff)} menos sobre el monto`
                : "—",
        },
        { label: "Quedó activo", value: formatYesNo(m.active) },
      ];

    case "discount.update": {
      const rows: DetailRow[] = [
        { label: "Descuento", value: String(m.name ?? "—") },
      ];
      if (m.code != null && String(m.code).length > 0) {
        rows.push({ label: "Código", value: String(m.code) });
      }
      const ch = m.changes as Record<string, unknown> | undefined;
      if (ch && typeof ch === "object") {
        for (const [key, val] of Object.entries(ch)) {
          if (val === undefined) continue;
          if (val === "" && key !== "code") continue;
          const label = CHANGE_FIELD_LABELS[key];
          if (!label) continue;
          rows.push({ label, value: formatChangeValue(key, val) });
        }
      }
      return rows;
    }

    case "discount.delete":
      return [
        { label: "Nombre", value: String(m.name ?? "—") },
        {
          label: "Código",
          value: m.code ? String(m.code) : "No tenía código",
        },
        { label: "Tipo", value: formatKind(m.kind) },
      ];

    case "discount.activate":
    case "discount.deactivate":
      return [
        { label: "Nombre", value: String(m.name ?? "—") },
        {
          label: "Código",
          value: m.code ? String(m.code) : "No aplica",
        },
        { label: "Tipo", value: formatKind(m.kind) },
        {
          label: "Estado ahora",
          value: action === "discount.activate" ? "Activo" : "Inactivo",
        },
      ];

    case "cash.close":
      return [
        {
          label: "Efectivo según sistema (suma de tickets en el período)",
          value: formatMoney(m.cashTotal),
        },
        {
          label: "Efectivo contado al cerrar (lo que contaste físicamente)",
          value: formatMoney(
            m.declaredCashTotal != null && typeof m.declaredCashTotal === "number"
              ? m.declaredCashTotal
              : m.cashTotal
          ),
        },
        {
          label: "Cantidad de pagos en efectivo",
          value: String(m.cashCount ?? "—"),
        },
        {
          label: "Total de todos los medios",
          value: formatMoney(m.totalAll),
        },
        {
          label: "Cantidad total de pagos en el período",
          value: String(m.allCount ?? "—"),
        },
        {
          label: "Período desde",
          value:
            m.periodStart != null
              ? formatDateTime(m.periodStart)
              : "Desde el primer movimiento",
        },
        { label: "Cierre registrado", value: formatDateTime(m.periodEnd) },
        {
          label: "Nota del cierre",
          value: m.note ? String(m.note) : "Sin nota",
        },
      ];

    default:
      return [];
  }
}

export default function AuditView() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = filter
          ? `/api/admin/audit?action=${encodeURIComponent(filter)}&limit=100`
          : "/api/admin/audit?limit=100";
        const res = await fetch(url, { cache: "no-store" });
        const body = await res.json();
        if (cancelled) return;
        if (body?.ok) setItems(body.data.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos los eventos</option>
          <option value="user.create">Alta de socios</option>
          <option value="payment.create">Pagos</option>
          <option value="discount.create">Descuentos · creados</option>
          <option value="discount.update">Descuentos · editados</option>
          <option value="discount.delete">Descuentos · eliminados</option>
          <option value="discount.activate">Descuentos · activados</option>
          <option value="discount.deactivate">Descuentos · desactivados</option>
          <option value="cash.close">Cierres de caja</option>
        </select>
      </div>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          <ShieldCheck
            size={32}
            style={{ display: "block", margin: "0 auto 0.5rem" }}
          />
          No hay eventos aún con este filtro.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((i) => {
            const group = ACTION_GROUPS[i.action] ?? "other";
            const groupCls =
              group === "user"
                ? styles.user
                : group === "payment"
                  ? styles.payment
                  : group === "discount"
                    ? styles.discount
                    : group === "cash"
                      ? styles.cash
                      : "";
            const summary = summarize(i);
            const isExpanded = !!expanded[i.id];
            const category = CATEGORY_LABEL[group] ?? "Evento";
            const detailRows = metaToDetailRows(i.action, i.meta);
            return (
              <li key={i.id} className={`${styles.item} ${groupCls}`}>
                <div className={styles.head}>
                  <span className={styles.actor}>{i.actorName}</span>
                  <span className={styles.category}>{category}</span>
                  <span className={styles.time}>
                    {new Date(i.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={styles.desc}>
                  {ACTION_LABELS[i.action] ?? "Acción registrada"}
                  {summary ? ` · ${summary}` : ""}
                </div>
                {detailRows.length > 0 && (
                  <>
                    <button
                      type="button"
                      className={styles.showMeta}
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [i.id]: !e[i.id] }))
                      }
                    >
                      {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                    </button>
                    {isExpanded && (
                      <dl className={styles.detailList}>
                        {detailRows.map((row, idx) => (
                          <div
                            key={`${i.id}-d-${idx}`}
                            className={styles.detailRow}
                          >
                            <dt className={styles.detailLabel}>{row.label}</dt>
                            <dd className={styles.detailValue}>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
