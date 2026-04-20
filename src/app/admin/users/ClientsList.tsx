"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { isMembershipCritical } from "@/lib/membershipUi";
import styles from "./ClientsList.module.css";

type MembershipStatus = "active" | "expired" | "cancelled" | "none";

type ClientRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
  createdAt: string;
  membership: {
    status: MembershipStatus;
    rawStatus: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  } | null;
};

type Filter = "all" | "active" | "expired" | "cancelled" | "none";

export default function ClientsList() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users?role=client", {
          cache: "no-store",
          signal: ac.signal,
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message ?? "No se pudo cargar");
        setRows(json.data.items as ClientRow[]);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Error cargando lista");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const counts = useMemo(() => {
    const c = { all: rows.length, active: 0, expired: 0, cancelled: 0, none: 0 };
    for (const r of rows) {
      const s = r.membership?.status ?? "none";
      c[s]++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all") {
        const s = r.membership?.status ?? "none";
        if (s !== filter) return false;
      }
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  return (
    <section className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.searchRow}>
          <Input
            type="search"
            placeholder="Buscar por nombre o email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div className={styles.filters}>
          <Chip
            label="Todos"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <Chip
            label="Activas"
            count={counts.active}
            active={filter === "active"}
            tone="active"
            onClick={() => setFilter("active")}
          />
          <Chip
            label="Vencidas"
            count={counts.expired}
            active={filter === "expired"}
            tone="expired"
            onClick={() => setFilter("expired")}
          />
          {counts.cancelled > 0 && (
            <Chip
              label="Canceladas"
              count={counts.cancelled}
              active={filter === "cancelled"}
              tone="expired"
              onClick={() => setFilter("cancelled")}
            />
          )}
          {counts.none > 0 && (
            <Chip
              label="Sin membresía"
              count={counts.none}
              active={filter === "none"}
              onClick={() => setFilter("none")}
            />
          )}
        </div>
      </header>

      {loading && rows.length === 0 ? (
        <p className={styles.emptyState}>Cargando…</p>
      ) : error ? (
        <p className={styles.emptyState} style={{ color: "#fecdd3" }}>
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>
          {rows.length === 0
            ? "Aún no hay socios registrados."
            : "Ningún socio coincide con los filtros."}
        </p>
      ) : (
        <ul className={styles.list} role="list">
          {filtered.map((r) => (
            <ClientRowItem key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Chip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: "active" | "expired";
  onClick: () => void;
}) {
  const cls = [
    styles.chip,
    active ? styles.active : null,
    tone === "active" ? styles.toneActive : null,
    tone === "expired" ? styles.toneExpired : null,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" onClick={onClick} className={cls}>
      {label}
      <span className={styles.chipCount}>{count}</span>
    </button>
  );
}

function ClientRowItem({ row }: { row: ClientRow }) {
  const initial = row.name.charAt(0).toUpperCase();
  const s = row.membership?.status ?? "none";
  const critical =
    s === "active" &&
    row.membership != null &&
    isMembershipCritical(row.membership.daysRemaining);
  const tone: "success" | "danger" | "neutral" =
    s === "active"
      ? critical
        ? "danger"
        : "success"
      : s === "none"
      ? "neutral"
      : "danger";
  const label =
    s === "active"
      ? critical
        ? "¡Por vencer!"
        : "Activa"
      : s === "expired"
      ? "Vencida"
      : s === "cancelled"
      ? "Cancelada"
      : "Sin membresía";

  return (
    <li className={styles.row}>
      <span className={styles.avatar}>
        {row.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={row.photoUrl} alt={row.name} />
        ) : (
          <span>{initial}</span>
        )}
      </span>
      <div className={styles.rowMain}>
        <div className={styles.rowName}>{row.name}</div>
        <div className={styles.rowMeta}>{row.email}</div>
      </div>
      <div className={styles.rowMembership}>
        <Badge tone={tone} dot>
          {label}
        </Badge>
        {row.membership && s === "active" && (
          <span
            className={`${styles.days} ${critical ? styles.daysCritical : ""}`}
          >
            {critical ? "🔴 " : ""}
            {row.membership.daysRemaining} día
            {row.membership.daysRemaining === 1 ? "" : "s"}
          </span>
        )}
        {row.membership && s !== "active" && s !== "none" && (
          <span className={styles.days}>
            Venció {new Date(row.membership.endDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </li>
  );
}
