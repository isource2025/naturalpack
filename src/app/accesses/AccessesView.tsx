"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { User2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  isMembershipCritical,
  membershipCriticalCardNote,
} from "@/lib/membershipUi";
import styles from "./AccessesView.module.css";

// ---------- Tipos compartidos con la API ----------
type AccessItem = {
  id: string;
  userId: string | null;
  status: "granted" | "denied";
  reason: string | null;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
  } | null;
};

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
  createdAt: string;
  membership: {
    status: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  } | null;
  recentAccesses: Array<{
    id: string;
    status: "granted" | "denied";
    reason: string | null;
    timestamp: string;
  }>;
};

type SseAccessResult = {
  status: "granted" | "denied";
  user: { name: string; photoUrl: string | null };
  membership: { daysRemaining: number };
  message: string;
  gymId: string | null;
  kioskSessionId: string | null;
  timestamp: string;
};

const LIST_LIMIT = 100;

export default function AccessesView({ gymId }: { gymId: string }) {
  const [items, setItems] = useState<AccessItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [liveConnected, setLiveConnected] = useState(false);

  const fetchListAbort = useRef<AbortController | null>(null);

  const fetchList = useCallback(async () => {
    fetchListAbort.current?.abort();
    const ac = new AbortController();
    fetchListAbort.current = ac;
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(`/api/admin/accesses?limit=${LIST_LIMIT}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "No se pudo cargar");
      setItems(json.data.items as AccessItem[]);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setListError(e instanceof Error ? e.message : "Error cargando accesos");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      const first = items[0];
      if (first?.userId) setSelectedId(first.id);
    }
  }, [items, selectedId]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  useEffect(() => {
    const userId = selectedItem?.userId;
    if (!userId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    const ac = new AbortController();
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message ?? "No se pudo cargar");
        setDetail(json.data as UserDetail);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setDetailError(e instanceof Error ? e.message : "Error cargando socio");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    })();
    return () => ac.abort();
  }, [selectedItem?.userId]);

  useEffect(() => {
    const es = new EventSource(
      `/api/kiosk/stream?gymId=${encodeURIComponent(gymId)}`
    );
    es.addEventListener("ready", () => setLiveConnected(true));
    es.addEventListener("access:result", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as SseAccessResult;
        if (payload.gymId && payload.gymId !== gymId) return;
        fetchList();
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => setLiveConnected(false);
    return () => es.close();
  }, [gymId, fetchList]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Accesos</h1>
          <p className={styles.subtitle}>
            Lista en vivo de quién entró al gym · selecciona un socio para ver su
            ficha.
          </p>
        </div>
      </header>

      <section className={styles.grid}>
        {/* ---------- Columna izquierda: lista ---------- */}
        <aside className={styles.panel} aria-label="Lista de accesos">
          <header className={styles.listHead}>
            <h2>Accesos recientes</h2>
            <span
              className={`${styles.live} ${
                liveConnected ? styles.liveOn : styles.liveOff
              }`}
              title={liveConnected ? "Conectado en tiempo real" : "Sin conexión"}
            >
              <span className={styles.liveDot} />
              {liveConnected ? "En vivo" : "Offline"}
            </span>
          </header>

          {loadingList && items.length === 0 ? (
            <p className={styles.emptyState}>Cargando…</p>
          ) : listError ? (
            <p className={styles.emptyState} style={{ color: "#fecdd3" }}>
              {listError}
            </p>
          ) : items.length === 0 ? (
            <p className={styles.emptyState}>
              Aún no hay accesos registrados.
            </p>
          ) : (
            <ul className={styles.list} role="listbox">
              {items.map((it) => {
                const selected = it.id === selectedId;
                const name = it.user?.name ?? "Desconocido";
                const initial = name.charAt(0).toUpperCase();
                const rowCls = [
                  styles.row,
                  selected ? styles.rowSelected : null,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      className={rowCls}
                      onClick={() => setSelectedId(it.id)}
                      aria-selected={selected}
                      role="option"
                      disabled={!it.userId}
                    >
                      <span className={styles.avatar}>
                        {it.user?.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={it.user.photoUrl} alt={name} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </span>
                      <span className={styles.rowBody}>
                        <span className={styles.rowName}>{name}</span>
                        <span className={styles.rowTime}>
                          {formatDateTime(it.timestamp)}
                        </span>
                      </span>
                      <Badge
                        tone={it.status === "granted" ? "success" : "danger"}
                        dot
                      >
                        {it.status === "granted" ? "Permitido" : "Denegado"}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ---------- Columna derecha: detalle ---------- */}
        <section className={styles.panel} aria-label="Detalle del socio">
          {!selectedItem ? (
            <EmptyDetail />
          ) : !selectedItem.userId ? (
            <div className={styles.detailInner}>
              <p className={styles.hint}>
                Acceso denegado sin socio asociado (
                {selectedItem.reason ?? "motivo desconocido"}).
              </p>
            </div>
          ) : detailLoading && !detail ? (
            <div className={styles.detailInner}>
              <p className={styles.hint}>Cargando detalle…</p>
            </div>
          ) : detailError ? (
            <div className={styles.detailInner}>
              <p className="error">{detailError}</p>
            </div>
          ) : detail ? (
            <DetailPanel detail={detail} selectedAt={selectedItem.timestamp} />
          ) : null}
        </section>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------

function EmptyDetail() {
  return (
    <div className={styles.emptyDetail}>
      <div className={styles.emptyIcon}>
        <User2 size={28} />
      </div>
      <h3 style={{ margin: 0 }}>Selecciona un acceso</h3>
      <p className={styles.hint}>
        La información del socio aparecerá aquí.
      </p>
    </div>
  );
}

function DetailPanel({
  detail,
  selectedAt,
}: {
  detail: UserDetail;
  selectedAt: string;
}) {
  const initial = detail.name.charAt(0).toUpperCase();
  const m = detail.membership;
  const active = m?.status === "active" && (m?.daysRemaining ?? 0) > 0;
  const critical =
    active && m != null && isMembershipCritical(m.daysRemaining);

  return (
    <div className={styles.detailInner}>
      <header className={styles.detailHead}>
        <div className={`${styles.avatar} ${styles.lg}`}>
          {detail.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={detail.photoUrl} alt={detail.name} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <h2>{detail.name}</h2>
          <p className={styles.hint}>
            {detail.email} · {detail.role === "admin" ? "Admin" : "Cliente"}
          </p>
          <p className={styles.hint}>
            Socio desde {formatDate(detail.createdAt)}
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Este acceso</h3>
        <p style={{ margin: 0 }}>{formatDateTime(selectedAt)}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Membresía</h3>
        {m ? (
          <>
            <div className={styles.stats}>
              <span
                className={`${styles.statBig} ${
                  active && !critical ? styles.ok : styles.bad
                }`}
              >
                {m.daysRemaining}
              </span>
              <span className={styles.hint}>
                día{m.daysRemaining === 1 ? "" : "s"} restante
                {m.daysRemaining === 1 ? "" : "s"}
              </span>
              <Badge tone={active ? (critical ? "danger" : "success") : "danger"} dot>
                {active
                  ? critical
                    ? "¡Por vencer!"
                    : "Activa"
                  : m.status === "cancelled"
                  ? "Cancelada"
                  : "Vencida"}
              </Badge>
            </div>
            {critical && (
              <p className={styles.criticalNote}>{membershipCriticalCardNote(m.daysRemaining)}</p>
            )}
            <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
              Desde {formatDate(m.startDate)} hasta {formatDate(m.endDate)}
            </p>
          </>
        ) : (
          <p className={styles.hint}>Sin membresía registrada.</p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Historial reciente</h3>
        {detail.recentAccesses.length === 0 ? (
          <p className={styles.hint}>Sin accesos previos.</p>
        ) : (
          <ul className={styles.history}>
            {detail.recentAccesses.map((a) => (
              <li key={a.id}>
                <span className={`${styles.hdot} ${styles[a.status]}`} />
                <span className={styles.hTime}>
                  {formatDateTime(a.timestamp)}
                </span>
                <Badge tone={a.status === "granted" ? "success" : "danger"}>
                  {a.status === "granted" ? "Permitido" : "Denegado"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
