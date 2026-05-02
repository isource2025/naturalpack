"use client";

import { useState, type FormEvent } from "react";
import {
  User,
  Mail,
  Key,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  CalendarDays,
  Receipt,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Wallet,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import styles from "./NewUserForm.module.css";

type Method = "cash" | "transfer" | "card";

type Feedback =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ok";
      name: string;
      email: string;
      paid: boolean;
      amount?: number;
      method?: Method;
    }
  | { kind: "error"; message: string };

const PRESET_DAYS = [7, 15, 30, 60, 90, 180, 365].map((days) => ({
  days,
  label: `${days}d`,
}));

const METHODS: { id: Method; label: string; icon: JSX.Element }[] = [
  { id: "cash", label: "Efectivo", icon: <Banknote size={14} /> },
  { id: "transfer", label: "Transfer.", icon: <ArrowRightLeft size={14} /> },
  { id: "card", label: "Tarjeta", icon: <CreditCard size={14} /> },
];

const METHOD_LABEL: Record<Method, string> = {
  cash: "efectivo",
  transfer: "transferencia",
  card: "tarjeta",
};

function formatARS(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function NewUserForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [state, setState] = useState<Feedback>({ kind: "idle" });
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client" as "client" | "admin",
    membershipDays: 30,
    registerPayment: true,
    method: "cash" as Method,
    amount: 0,
    note: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setDays(n: number) {
    update("membershipDays", n);
  }

  function goToStep2(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "idle" });
    if (!form.name.trim() || form.name.trim().length < 2) {
      setState({ kind: "error", message: "Ingresa un nombre válido (mín. 2 caracteres)." });
      return;
    }
    if (!form.email.trim()) {
      setState({ kind: "error", message: "Ingresa un email." });
      return;
    }
    if (!form.password || form.password.length < 6) {
      setState({ kind: "error", message: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    setStep(2);
    if (form.role === "admin") {
      update("registerPayment", false);
    }
  }

  function goBack() {
    setStep(1);
    setState({ kind: "idle" });
  }

  async function finalizeSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "idle" });

    if (form.role === "admin") {
      if (form.membershipDays < 0 || form.membershipDays > 3650) {
        setState({ kind: "error", message: "Los días deben estar entre 0 y 3650." });
        return;
      }
    } else {
      if (form.registerPayment) {
        if (form.membershipDays < 1) {
          setState({ kind: "error", message: "Para cobrar, los días deben ser al menos 1." });
          return;
        }
        if (!Number.isFinite(form.amount) || form.amount < 1) {
          setState({ kind: "error", message: "Ingresa el costo a cobrar (mayor a 0)." });
          return;
        }
      } else if (form.membershipDays < 0 || form.membershipDays > 3650) {
        setState({ kind: "error", message: "Los días deben estar entre 0 y 3650." });
        return;
      }
    }

    setState({ kind: "loading" });

    try {
      const creationDays =
        form.role === "admin"
          ? form.membershipDays
          : form.registerPayment
            ? 0
            : form.membershipDays;

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          membershipDays: creationDays,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setState({
          kind: "error",
          message: json.error?.message ?? "No se pudo crear el socio",
        });
        return;
      }
      const createdUser = json.data.user;

      if (form.role === "client" && form.registerPayment) {
        const pRes = await fetch("/api/admin/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: createdUser.id,
            listAmount: Math.round(form.amount),
            days: form.membershipDays,
            method: form.method,
            applyAuto: true,
            note: form.note.trim() || undefined,
          }),
        });
        const pBody = await pRes.json();
        if (!pBody.ok) {
          setState({
            kind: "error",
            message:
              "Socio creado, pero el pago falló: " +
              (pBody.error?.message ?? "error desconocido"),
          });
          return;
        }
      }

      setState({
        kind: "ok",
        name: createdUser.name,
        email: createdUser.email,
        paid: form.role === "client" && form.registerPayment,
        amount: form.registerPayment ? form.amount : undefined,
        method: form.registerPayment ? form.method : undefined,
      });
      setStep(1);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "client",
        membershipDays: 30,
        registerPayment: true,
        method: "cash",
        amount: 0,
        note: "",
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Error de red",
      });
    }
  }

  const loading = state.kind === "loading";

  return (
    <div className={styles.wizard}>
      <header className={styles.stepHeader}>
        <div>
          <h2 className={styles.stepTitle}>Nuevo socio</h2>
          <p className={styles.stepSubtitle}>
            {step === 1
              ? "Primero cargamos los datos del socio."
              : form.role === "admin"
                ? "Define los días iniciales de acceso (si aplica) y confirma el alta."
                : "Asigna días y costo en el mismo paso. El monto lo defines tú, sin sugerencias automáticas."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span
            className={`${styles.stepBadge} ${step === 1 ? styles.stepBadgeActive : ""}`}
          >
            1 · Datos del socio
          </span>
          <span
            className={`${styles.stepBadge} ${step === 2 ? styles.stepBadgeActive : ""}`}
          >
            2 · {form.role === "admin" ? "Alta" : "Cobro"}
          </span>
        </div>
      </header>

      {step === 1 && (
        <div className={styles.step1Card}>
          <form className={styles.form} onSubmit={goToStep2}>
            <h3 className={styles.formTitle}>
              <UserPlus size={18} /> Datos del socio
            </h3>
            <p className={styles.formHint}>
              Después vas a completar el cobro (cliente) o los días de acceso
              (administrador).
            </p>

            <Input
              label="Nombre"
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Juan Pérez"
              leftIcon={<User size={16} />}
            />

            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="juan@example.com"
              leftIcon={<Mail size={16} />}
            />

            <Input
              label="Contraseña inicial"
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Al menos 6 caracteres"
              hint="El socio podrá cambiarla cuando quiera."
              leftIcon={<Key size={16} />}
            />

            <div className={styles.fieldWrap}>
              <label className={styles.label} htmlFor="new-role">
                Rol
              </label>
              <select
                id="new-role"
                className={styles.select}
                value={form.role}
                onChange={(e) =>
                  update("role", e.target.value as "client" | "admin")
                }
              >
                <option value="client">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {state.kind === "error" && (
              <div className={styles.err}>
                <AlertTriangle size={16} />
                <span>{state.message}</span>
              </div>
            )}
            {state.kind === "ok" && (
              <div className={styles.ok}>
                <CheckCircle2 size={16} />
                <span>
                  Socio creado: <strong>{state.name}</strong> ({state.email}).
                </span>
              </div>
            )}

            <div className={styles.step1Actions}>
              <Button
                type="submit"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
              >
                Continuar al paso 2
              </Button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step2Layout}>
          <aside className={styles.clientSummary}>
            <p className={styles.clientSummaryTitle}>Socio a dar de alta</p>
            <p className={styles.clientName}>{form.name.trim()}</p>
            <p className={styles.clientLine}>{form.email.trim().toLowerCase()}</p>
            <div>
              <Badge tone={form.role === "client" ? "brand" : "neutral"}>
                {form.role === "client" ? "Cliente" : "Administrador"}
              </Badge>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={goBack}
              className={styles.backBtn}
            >
              Volver a datos
            </Button>
          </aside>

          {form.role === "admin" ? (
            <form className={styles.form} onSubmit={finalizeSubmit}>
              <h3 className={styles.formTitle}>
                <CalendarDays size={18} /> Acceso inicial
              </h3>
              <p className={styles.formHint}>
                Los administradores no pasan por cobro. Podés dejar 0 días o
                asignar membresía inicial si tu flujo lo usa.
              </p>
              <Input
                label="Días de membresía / acceso"
                type="number"
                min={0}
                max={3650}
                value={form.membershipDays}
                onChange={(e) => setDays(Number(e.target.value))}
                leftIcon={<CalendarDays size={16} />}
              />
              {state.kind === "error" && (
                <div className={styles.err}>
                  <AlertTriangle size={16} />
                  <span>{state.message}</span>
                </div>
              )}
              <div className={styles.step2Actions}>
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  leftIcon={<UserPlus size={18} />}
                >
                  {loading ? "Creando…" : "Crear administrador"}
                </Button>
              </div>
            </form>
          ) : (
            <form className={styles.cobroPanel} onSubmit={finalizeSubmit}>
              <h3 className={styles.cobroTitle}>
                <Wallet size={14} /> Cobro y membresía
              </h3>

              <Input
                label="Días de membresía"
                type="number"
                min={0}
                max={3650}
                value={form.membershipDays}
                onChange={(e) => setDays(Number(e.target.value))}
                leftIcon={<CalendarDays size={16} />}
                hint="Los días que sumas al plan del socio van aquí, junto al costo."
              />

              <div className={styles.presets} aria-label="Plantillas de días">
                {PRESET_DAYS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    className={`${styles.presetBtn} ${
                      form.membershipDays === p.days ? styles.presetBtnActive : ""
                    }`}
                    onClick={() => setDays(p.days)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <p className={styles.totalHint}>Resumen del cobro</p>
                <p className={styles.totalDays}>
                  {form.membershipDays > 0
                    ? `${form.membershipDays} día${form.membershipDays === 1 ? "" : "s"} de membresía`
                    : "Sin días asignados aún"}
                </p>
                <div className={styles.totalDisplay}>
                  <span className={styles.totalCurrency}>$</span>
                  {Number.isFinite(form.amount) && form.amount > 0
                    ? form.amount.toLocaleString("es-AR")
                    : "—"}
                </div>
                <p className={styles.totalHint}>
                  Ingresa abajo el monto que cobras; no hay sugerencia automática.
                </p>
              </div>

              <div className={styles.amountInputRow}>
                <label className={styles.label} htmlFor="pay-amount">
                  Costo a cobrar ($)
                </label>
                <div className={styles.amountInputBase}>
                  <span className={styles.amountPrefix}>$</span>
                  <input
                    id="pay-amount"
                    className={styles.amountInput}
                    type="number"
                    min={1}
                    step={1}
                    value={form.amount || ""}
                    disabled={!form.registerPayment}
                    onChange={(e) =>
                      update("amount", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <label className={styles.label} style={{ marginBottom: 6, display: "block" }}>
                  Medio de pago
                </label>
                <div className={styles.methodChips} role="radiogroup">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={form.method === m.id}
                      disabled={!form.registerPayment}
                      className={`${styles.methodChip} ${
                        form.method === m.id ? styles.methodChipActive : ""
                      }`}
                      onClick={() => update("method", m.id)}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.registerPayment}
                  onChange={(e) => update("registerPayment", e.target.checked)}
                />
                <Receipt size={15} />
                Registrar el pago en caja
              </label>

              {form.registerPayment && (
                <Input
                  label="Nota del pago (opcional)"
                  type="text"
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  placeholder="Alta + mes de abril"
                />
              )}

              {!form.registerPayment && (
                <Badge tone="neutral">
                  Se darán de alta solo los días de arriba, sin movimiento de caja.
                </Badge>
              )}

              {state.kind === "error" && (
                <div className={styles.err}>
                  <AlertTriangle size={16} />
                  <span>{state.message}</span>
                </div>
              )}
              {state.kind === "ok" && (
                <div className={styles.ok}>
                  <CheckCircle2 size={16} />
                  <span>
                    Socio creado: <strong>{state.name}</strong> ({state.email}).
                    {state.paid && state.amount !== undefined && (
                      <>
                        {" "}
                        Cobraste {formatARS(state.amount)} (
                        {state.method ? METHOD_LABEL[state.method] : ""}).
                      </>
                    )}
                  </span>
                </div>
              )}

              <div className={styles.step2Actions}>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  leftIcon={<UserPlus size={18} />}
                >
                  {loading
                    ? "Creando…"
                    : form.registerPayment
                      ? `Confirmar alta y cobrar ${formatARS(Math.max(0, form.amount || 0))}`
                      : `Confirmar alta (${form.membershipDays} días)`}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
