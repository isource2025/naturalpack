"use client";

import { useState } from "react";
import { BellRing, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import NotifyStaffSuccess from "./NotifyStaffSuccess";
import styles from "./NotifyStaffButton.module.css";

type Feedback =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; name: string; days: number }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string };

/**
 * Botón "Avisar al personal antes de ingresar al gimnasio".
 *
 * Llama a POST /api/access/notify-staff y, ante una respuesta positiva,
 * monta una pantalla fullscreen (NotifyStaffSuccess) para dar un feedback
 * claro al socio — equivalente al /scan después de escanear el QR.
 */
export default function NotifyStaffButton() {
  const [state, setState] = useState<Feedback>({ kind: "idle" });

  async function onClick() {
    if (state.kind === "loading") return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/access/notify-staff", { method: "POST" });
      const json = await res.json();
      if (!json.ok) {
        setState({
          kind: "error",
          message: json.error?.message ?? "No se pudo avisar al personal",
        });
        return;
      }
      const data = json.data as {
        status: "granted" | "denied";
        user: { name: string };
        membership: { daysRemaining: number };
        message: string;
      };
      if (data.status === "granted") {
        setState({
          kind: "ok",
          name: data.user.name,
          days: data.membership.daysRemaining,
        });
      } else {
        setState({ kind: "denied", message: data.message });
      }
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Error de red",
      });
    }
  }

  const loading = state.kind === "loading";
  const showOverlay = state.kind === "ok" || state.kind === "denied";

  return (
    <div className={styles.wrap}>
      <Button
        size="xl"
        fullWidth
        onClick={onClick}
        loading={loading}
        leftIcon={<BellRing size={20} />}
      >
        {loading ? "Avisando al personal…" : "Avisar al personal"}
      </Button>

      {state.kind === "error" && (
        <div role="alert" className={`${styles.feedback} ${styles.err}`}>
          <AlertTriangle size={18} />
          <span>{state.message}</span>
        </div>
      )}

      {showOverlay && state.kind === "ok" && (
        <NotifyStaffSuccess
          kind="granted"
          name={state.name}
          days={state.days}
          onClose={() => setState({ kind: "idle" })}
        />
      )}
      {showOverlay && state.kind === "denied" && (
        <NotifyStaffSuccess
          kind="denied"
          message={state.message}
          onClose={() => setState({ kind: "idle" })}
        />
      )}
    </div>
  );
}
