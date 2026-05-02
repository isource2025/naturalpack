"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CircleCheck,
  CirclePause,
  Clock,
  DollarSign,
  Users,
  RefreshCw,
  Wallet,
  Plus,
  CalendarDays,
  MessageSquare,
  X,
  Trash2,
  ChevronRight,
  ShieldHalf,
  Info,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "./PlatformView.module.css";

type GymStatus = "active" | "trial" | "suspended";

type GymRow = {
  id: string;
  name: string;
  slug: string;
  status: GymStatus;
  trialEndsAt: string | null;
  createdAt: string;
  usersCount: number;
  paymentsCount: number;
  platformPaymentsCount: number;
  lastPlatformPayment: {
    id: string;
    amount: number;
    method: string;
    createdAt: string;
  } | null;
};

type Summary = {
  totalGyms: number;
  activeGyms: number;
  trialGyms: number;
  suspendedGyms: number;
  platformRevenue: number;
  platformPaymentsCount: number;
};

type PlatformPaymentRow = {
  id: string;
  amount: number;
  method: string;
  periodStart: string | null;
  periodEnd: string | null;
  note: string | null;
  createdAt: string;
  recordedBy: { id: string; name: string } | null;
};

const PAYMENT_METHODS: Array<{
  value: "cash" | "transfer" | "card" | "mercadopago";
  label: string;
}> = [
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "mercadopago", label: "Mercado Pago" },
];

export default function PlatformView() {
  const [items, setItems] = useState<GymRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GymRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadGyms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/gyms", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Error cargando gyms");
      setItems(json.data.items as GymRow[]);
      setSummary(json.data.summary as Summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGyms();
  }, [loadGyms]);

  async function onStatusChange(gym: GymRow, status: GymStatus) {
    const res = await fetch(`/api/platform/gyms/${gym.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error?.message || "Error actualizando estado");
      return;
    }
    await loadGyms();
    if (selected?.id === gym.id) {
      setSelected({ ...gym, status });
    }
  }

  async function onDelete(gym: GymRow) {
    const res = await fetch(
      `/api/platform/gyms/${gym.id}?confirm=${encodeURIComponent(gym.slug)}`,
      { method: "DELETE" }
    );
    const json = await res.json();
    if (!json.ok) {
      alert(json.error?.message || "No se pudo eliminar el gym");
      return;
    }
    if (selected?.id === gym.id) setSelected(null);
    await loadGyms();
  }

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>
            <ShieldHalf size={20} /> Plataforma
          </h1>
          <p className={styles.sub}>
            Gimnasios, estados y cobros de NaturalPack.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void loadGyms()}
            loading={loading}
          >
            Refrescar
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowCreate((v) => !v)}
          >
            Nuevo gimnasio
          </Button>
        </div>
      </header>

      {showCreate && (
        <CreateGymForm
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await loadGyms();
          }}
        />
      )}

      {summary && <SummaryRow summary={summary} />}

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.grid}>
        <GymsTable
          items={items}
          loading={loading}
          selectedId={selected?.id ?? null}
          onSelect={(g) => setSelected(g)}
          onStatusChange={onStatusChange}
        />

        {selected && (
          <>
            <div
              className={styles.drawerBackdrop}
              onClick={() => setSelected(null)}
            />
            <GymDetail
              key={selected.id}
              gym={selected}
              onClose={() => setSelected(null)}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onPaymentRecorded={loadGyms}
            />
          </>
        )}
        {!selected && (
          <aside className={styles.detailEmpty}>
            <Building2 size={28} />
            <p>Selecciona un gimnasio para ver detalles y registrar pagos.</p>
          </aside>
        )}
      </div>
    </section>
  );
}

/* ------------------------------ Create form ------------------------------ */
function CreateGymForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<GymStatus>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/platform/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          status,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Error");
      setName("");
      setSlug("");
      setStatus("active");
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.createCard} onSubmit={onSubmit}>
      <div className={styles.createHead}>
        <strong>
          <Plus size={14} /> Nuevo gimnasio
        </strong>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
      <div className={styles.createRow}>
        <Input
          label="Nombre del gimnasio"
          placeholder="Box Ciudadela"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          leftIcon={<Building2 size={16} />}
        />
        <Input
          label="Código (slug) — opcional"
          placeholder="box-ciudadela"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="Si lo dejás vacío se genera desde el nombre"
        />
      </div>
      <div className={styles.methodRow}>
        {(["active", "trial", "suspended"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.methodChip} ${
              status === s ? styles.methodChipActive : ""
            }`}
            onClick={() => setStatus(s)}
          >
            {s === "active"
              ? "Activo"
              : s === "trial"
                ? "En trial"
                : "Suspendido"}
          </button>
        ))}
      </div>
      {error && <div className={styles.errorBox}>{error}</div>}
      <Button type="submit" fullWidth loading={submitting}>
        Crear gimnasio
      </Button>
      <p className={styles.createHint}>
        <Info size={12} /> El owner del gym se registra después en{" "}
        <code>/register?as=owner</code> usando el mismo nombre/slug.
      </p>
    </form>
  );
}

/* ------------------------------ Summary ------------------------------ */
function SummaryRow({ summary }: { summary: Summary }) {
  return (
    <div className={styles.summaryRow}>
      <SummaryCard
        label="Gimnasios"
        value={summary.totalGyms.toString()}
        icon={<Building2 size={16} />}
        tone="brand"
      />
      <SummaryCard
        label="Activos"
        value={summary.activeGyms.toString()}
        icon={<CircleCheck size={16} />}
        tone="success"
      />
      <SummaryCard
        label="Trial"
        value={summary.trialGyms.toString()}
        icon={<Clock size={16} />}
        tone="warn"
      />
      <SummaryCard
        label="Suspendidos"
        value={summary.suspendedGyms.toString()}
        icon={<CirclePause size={16} />}
        tone="danger"
      />
      <SummaryCard
        label="Recaudación"
        value={formatMoney(summary.platformRevenue)}
        hint={`${summary.platformPaymentsCount} cobros`}
        icon={<Wallet size={16} />}
        tone="accent"
        full
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone,
  full,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "warn" | "danger" | "accent";
  full?: boolean;
}) {
  return (
    <div
      className={`${styles.summaryCard} ${styles[`tone-${tone}`]} ${
        full ? styles.summaryFull : ""
      }`}
    >
      <span className={styles.summaryLabel}>
        {icon} {label}
      </span>
      <span className={styles.summaryValue}>{value}</span>
      {hint && <span className={styles.summaryHint}>{hint}</span>}
    </div>
  );
}

/* ------------------------------ Table/Cards ------------------------------ */
function GymsTable({
  items,
  loading,
  selectedId,
  onSelect,
  onStatusChange,
}: {
  items: GymRow[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (g: GymRow) => void;
  onStatusChange: (g: GymRow, s: GymStatus) => void;
}) {
  if (loading && items.length === 0) {
    return <div className={styles.loadingCard}>Cargando gimnasios…</div>;
  }
  if (items.length === 0) {
    return (
      <div className={styles.emptyCard}>
        Todavía no hay gimnasios. Cuando un dueño complete{" "}
        <code>/register?as=owner</code> (o cuando crees uno desde aquí),
        aparecerá en la lista.
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <ul className={styles.list}>
        {items.map((g) => (
          <li
            key={g.id}
            className={`${styles.row} ${
              selectedId === g.id ? styles.rowActive : ""
            }`}
            onClick={() => onSelect(g)}
          >
            <div className={styles.rowTop}>
              <div className={styles.gymMain}>
                <div className={styles.gymName}>{g.name}</div>
                <code className={styles.gymSlug}>{g.slug}</code>
              </div>
              <div className={styles.rowTopRight}>
                <StatusBadge status={g.status} />
                <ChevronRight
                  size={16}
                  className={styles.chev}
                  aria-hidden
                />
              </div>
            </div>

            <div className={styles.rowMeta}>
              <span>
                <Users size={12} /> {g.usersCount} socios
              </span>
              <span>
                <Wallet size={12} />{" "}
                {g.lastPlatformPayment
                  ? formatMoney(g.lastPlatformPayment.amount)
                  : "sin pagos"}
              </span>
              {g.status === "trial" && g.trialEndsAt && (
                <span>
                  <Clock size={12} />{" "}
                  {new Date(g.trialEndsAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div
              className={styles.rowActions}
              onClick={(e) => e.stopPropagation()}
            >
              <QuickStatus
                current={g.status}
                onChange={(s) => onStatusChange(g, s)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: GymStatus }) {
  if (status === "active") {
    return (
      <Badge tone="success" dot>
        Activo
      </Badge>
    );
  }
  if (status === "trial") {
    return (
      <Badge tone="warn" dot>
        Trial
      </Badge>
    );
  }
  return (
    <Badge tone="danger" dot>
      Suspendido
    </Badge>
  );
}

function QuickStatus({
  current,
  onChange,
}: {
  current: GymStatus;
  onChange: (s: GymStatus) => void;
}) {
  return (
    <div className={styles.quickStatus}>
      {(["active", "trial", "suspended"] as const).map((s) => (
        <button
          key={s}
          type="button"
          className={`${styles.pill} ${current === s ? styles.pillActive : ""}`}
          onClick={() => onChange(s)}
        >
          {s === "active" ? "Activo" : s === "trial" ? "Trial" : "Suspender"}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Detail ------------------------------ */
function GymDetail({
  gym,
  onClose,
  onStatusChange,
  onDelete,
  onPaymentRecorded,
}: {
  gym: GymRow;
  onClose: () => void;
  onStatusChange: (g: GymRow, s: GymStatus) => void;
  onDelete: (g: GymRow) => void;
  onPaymentRecorded: () => Promise<void> | void;
}) {
  const [payments, setPayments] = useState<PlatformPaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["value"]>("transfer");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  const isProtected = gym.slug === "platform";

  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/platform/gyms/${gym.id}/payments`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Error");
      setPayments(json.data.items as PlatformPaymentRow[]);
    } catch {
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [gym.id]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const total = useMemo(
    () => payments.reduce((acc, p) => acc + p.amount, 0),
    [payments]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setFormError("Ingresa un monto válido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/platform/gyms/${gym.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          method,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Error");
      setAmount("");
      setNote("");
      await Promise.all([loadPayments(), onPaymentRecorded()]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className={styles.detail} role="dialog" aria-modal="true">
      <header className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailTitle}>{gym.name}</h2>
          <code className={styles.detailSlug}>{gym.slug}</code>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </header>

      <div className={styles.detailMeta}>
        <div>
          <span className={styles.metaLabel}>Estado</span>
          <StatusBadge status={gym.status} />
        </div>
        <div>
          <span className={styles.metaLabel}>Socios</span>
          <strong>{gym.usersCount}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Desde</span>
          <strong>{new Date(gym.createdAt).toLocaleDateString()}</strong>
        </div>
      </div>

      <div className={styles.detailActions}>
        <Button
          size="sm"
          variant={gym.status === "active" ? "primary" : "secondary"}
          onClick={() => onStatusChange(gym, "active")}
        >
          <CircleCheck size={14} /> Activo
        </Button>
        <Button
          size="sm"
          variant={gym.status === "trial" ? "accent" : "secondary"}
          onClick={() => onStatusChange(gym, "trial")}
        >
          <Clock size={14} /> Trial
        </Button>
        <Button
          size="sm"
          variant={gym.status === "suspended" ? "danger" : "secondary"}
          onClick={() => onStatusChange(gym, "suspended")}
        >
          <CirclePause size={14} /> Suspender
        </Button>
      </div>

      <section className={styles.paymentsSection}>
        <h3 className={styles.detailSubtitle}>
          <DollarSign size={16} /> Pagos del gym a la plataforma
        </h3>

        <form className={styles.paymentForm} onSubmit={onSubmit}>
          <Input
            type="number"
            inputMode="numeric"
            label="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="15000"
            required
            min={1}
            leftIcon={<DollarSign size={16} />}
          />
          <div className={styles.methodRow}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`${styles.methodChip} ${
                  method === m.value ? styles.methodChipActive : ""
                }`}
                onClick={() => setMethod(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Input
            type="text"
            label="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Abril 2026, transferencia #3421"
            leftIcon={<MessageSquare size={16} />}
          />
          {formError && <div className={styles.errorBox}>{formError}</div>}
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            leftIcon={<Plus size={14} />}
          >
            Registrar pago
          </Button>
        </form>

        <div className={styles.paymentsTotal}>
          <span>Total cobrado</span>
          <strong>{formatMoney(total)}</strong>
        </div>

        {loadingPayments ? (
          <div className={styles.loadingLine}>Cargando pagos…</div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyLine}>Sin pagos registrados.</div>
        ) : (
          <ul className={styles.paymentsList}>
            {payments.map((p) => (
              <li key={p.id} className={styles.paymentItem}>
                <div className={styles.paymentMain}>
                  <strong>{formatMoney(p.amount)}</strong>
                  <span className={styles.paymentMethod}>
                    {labelMethod(p.method)}
                  </span>
                </div>
                <div className={styles.paymentMeta}>
                  <span>
                    <CalendarDays size={12} />{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </span>
                  {p.recordedBy && (
                    <span className={styles.muted}>
                      por {p.recordedBy.name}
                    </span>
                  )}
                </div>
                {p.note && <div className={styles.paymentNote}>{p.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isProtected && (
        <section className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>
            <Trash2 size={14} /> Zona de peligro
          </h3>
          {!confirmDel ? (
            <>
              <p className={styles.dangerDesc}>
                Eliminar este gimnasio borra de forma permanente todos sus
                socios, pagos, accesos, descuentos y auditoría.
              </p>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                leftIcon={<Trash2 size={14} />}
                onClick={() => setConfirmDel(true)}
              >
                Eliminar gimnasio
              </Button>
            </>
          ) : (
            <>
              <p className={styles.dangerDesc}>
                Para confirmar, escribe el código{" "}
                <code>{gym.slug}</code> exactamente.
              </p>
              <Input
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                placeholder={gym.slug}
                autoFocus
              />
              <div className={styles.dangerRow}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConfirmDel(false);
                    setConfirmSlug("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirmSlug !== gym.slug}
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => onDelete(gym)}
                >
                  Borrar definitivamente
                </Button>
              </div>
            </>
          )}
        </section>
      )}
    </aside>
  );
}

/* ------------------------------ Utils ------------------------------ */
function formatMoney(amount: number) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function labelMethod(m: string) {
  switch (m) {
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    case "card":
      return "Tarjeta";
    case "mercadopago":
      return "Mercado Pago";
    default:
      return m;
  }
}
