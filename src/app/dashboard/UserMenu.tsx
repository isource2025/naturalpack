"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Lock,
  LogOut,
  ShieldHalf,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "./UserMenu.module.css";

type View = "menu" | "password";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export default function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role?: "admin" | "client" | "superadmin";
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [current, setCurrent] = useState("");
  const [next1, setNext1] = useState("");
  const [next2, setNext2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [logout, setLogout] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok"; message: string } | { kind: "err"; message: string } | null
  >(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    // Pequeño delay para que no se vea el cambio de vista al cerrar.
    setTimeout(() => {
      setView("menu");
      setCurrent("");
      setNext1("");
      setNext2("");
      setFeedback(null);
    }, 180);
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (next1 !== next2) {
      setFeedback({ kind: "err", message: "Las contraseñas nuevas no coinciden" });
      return;
    }
    if (next1.length < 6) {
      setFeedback({ kind: "err", message: "Mínimo 6 caracteres" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next1 }),
      });
      const body = await res.json();
      if (!body.ok) {
        setFeedback({
          kind: "err",
          message: body.error?.message || "No se pudo cambiar la contraseña",
        });
        return;
      }
      setFeedback({ kind: "ok", message: "¡Listo! Contraseña actualizada" });
      setCurrent("");
      setNext1("");
      setNext2("");
      setTimeout(() => close(), 1200);
    } catch (err) {
      setFeedback({
        kind: "err",
        message: err instanceof Error ? err.message : "Error de red",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    setLogout(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLogout(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar} aria-hidden>
          {getInitials(name)}
        </span>
        <span className={styles.triggerName}>{name.split(" ")[0] ?? name}</span>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={close} />
          <div className={styles.panel} role="menu">
            {view === "menu" ? (
              <>
                <div className={styles.header}>
                  <span className={styles.headerName}>{name}</span>
                  <span className={styles.headerEmail}>{email}</span>
                </div>

                {role === "superadmin" && (
                  <>
                    <Link
                      href="/platform"
                      className={styles.menuItem}
                      onClick={close}
                    >
                      <ShieldHalf size={16} />
                      Panel de plataforma
                    </Link>
                    <div className={styles.sep} />
                  </>
                )}

                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => setView("password")}
                >
                  <KeyRound size={16} />
                  Cambiar contraseña
                </button>

                <div className={styles.sep} />

                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.danger}`}
                  onClick={onLogout}
                  disabled={logout}
                >
                  <LogOut size={16} />
                  {logout ? "Saliendo…" : "Cerrar sesión"}
                </button>
              </>
            ) : (
              <form className={styles.form} onSubmit={onChangePassword}>
                <div className={styles.formHead}>
                  <button
                    type="button"
                    className={styles.back}
                    onClick={() => {
                      setView("menu");
                      setFeedback(null);
                    }}
                    aria-label="Volver"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className={styles.formTitle}>Cambiar contraseña</span>
                </div>

                <Input
                  label="Contraseña actual"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  leftIcon={<Lock size={16} />}
                />

                <Input
                  label="Nueva contraseña"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={next1}
                  onChange={(e) => setNext1(e.target.value)}
                  leftIcon={<KeyRound size={16} />}
                  hint="Mínimo 6 caracteres"
                />

                <Input
                  label="Repite la nueva"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={next2}
                  onChange={(e) => setNext2(e.target.value)}
                  leftIcon={<KeyRound size={16} />}
                />

                {feedback?.kind === "ok" && (
                  <div className={`${styles.feedback} ${styles.ok}`}>
                    <CheckCircle2 size={14} />
                    <span>{feedback.message}</span>
                  </div>
                )}
                {feedback?.kind === "err" && (
                  <div className={`${styles.feedback} ${styles.err}`}>
                    <AlertTriangle size={14} />
                    <span>{feedback.message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  fullWidth
                  loading={submitting}
                  leftIcon={<KeyRound size={14} />}
                >
                  {submitting ? "Guardando…" : "Actualizar contraseña"}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
