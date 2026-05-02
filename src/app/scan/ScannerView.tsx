"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  ScanLine,
  AlertTriangle,
  Dumbbell,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Nav from "@/components/ui/Nav";
import {
  isMembershipCritical,
  membershipCriticalScannerRenewHint,
} from "@/lib/membershipUi";
import styles from "./ScannerView.module.css";

type AccessResult = {
  status: "granted" | "denied";
  user: { name: string; photoUrl: string | null };
  membership: { daysRemaining: number };
  message: string;
};

type UIState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "submitting" }
  | { kind: "result"; data: AccessResult }
  | { kind: "error"; message: string };

function extractToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith("kq_")) return text;
  try {
    const url = new URL(text);
    const t = url.searchParams.get("token");
    if (t && t.startsWith("kq_")) return t;
  } catch {
    /* not a URL */
  }
  return null;
}

export default function ScannerView({
  initialToken,
}: {
  initialToken: string | null;
}) {
  // Si el usuario entró desde la cámara del teléfono con ?token=..., arrancamos
  // directamente en "submitting" para no mostrar ni un frame del botón
  // "Abrir cámara".
  const hasInitialToken = Boolean(initialToken && extractToken(initialToken));
  const [ui, setUi] = useState<UIState>(
    hasInitialToken ? { kind: "submitting" } : { kind: "idle" }
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ stop: () => void; destroy: () => void } | null>(
    null
  );
  /** Solo evita doble POST simultáneo; el mismo QR puede usarse muchas veces. */
  const inFlightRef = useRef(false);

  const submit = useCallback(async (token: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setUi({ kind: "submitting" });
    try {
      const res = await fetch("/api/access/check-in", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!json.ok) {
        const msg = json.error?.message || "Error validando QR";
        setUi({ kind: "error", message: msg });
        return;
      }
      setUi({ kind: "result", data: json.data as AccessResult });
    } catch (e) {
      setUi({
        kind: "error",
        message: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!initialToken) return;
    const t = extractToken(initialToken);
    if (t) void submit(t);
    else
      setUi({
        kind: "error",
        message: "El enlace no contiene un token válido",
      });
  }, [initialToken, submit]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;

    const secure =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    if (!secure) {
      setUi({
        kind: "error",
        message:
          "Tu navegador bloquea la cámara en conexiones no seguras. Abre esta página con HTTPS o desde localhost.",
      });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setUi({
        kind: "error",
        message: "Este navegador no soporta acceso a la cámara (getUserMedia).",
      });
      return;
    }

    setUi({ kind: "scanning" });
    try {
      const mod = await import("qr-scanner");
      const QrScanner = mod.default;

      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) {
        setUi({
          kind: "error",
          message: "No se detectó cámara en este dispositivo.",
        });
        return;
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const token = extractToken(result.data);
          if (!token) return;
          try {
            scanner.stop();
          } catch {
            /* noop */
          }
          void submit(token);
        },
        {
          highlightScanRegion: false,
          highlightCodeOutline: false,
          preferredCamera: "environment",
          maxScansPerSecond: 5,
        }
      );
      scannerRef.current = {
        stop: () => {
          try {
            scanner.stop();
          } catch {
            /* noop */
          }
        },
        destroy: () => scanner.destroy(),
      };
      await scanner.start();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      let friendly = `No se pudo abrir la cámara: ${raw}`;
      if (/denied|not allowed|permission/i.test(raw)) {
        friendly =
          "Permiso de cámara denegado. Revísalo en el candado de la barra de direcciones y vuelve a intentar.";
      } else if (/notfound|devicesnotfound|no camera/i.test(raw)) {
        friendly = "No se encontró una cámara utilizable.";
      } else if (/inUse|NotReadable|busy/i.test(raw)) {
        friendly = "La cámara está en uso por otra aplicación.";
      }
      setUi({ kind: "error", message: friendly });
    }
  }, [submit]);

  /** Cámara en el navegador apenas entrás a /scan (sin ?token=). */
  useEffect(() => {
    const skipCamera = Boolean(initialToken && extractToken(initialToken));
    if (skipCamera) return;
    const id = window.setTimeout(() => void startScanner(), 150);
    return () => clearTimeout(id);
  }, [initialToken, startScanner]);

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
    };
  }, []);

  function reset() {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    inFlightRef.current = false;
    setUi({ kind: "idle" });
    const skipCamera = Boolean(initialToken && extractToken(initialToken));
    if (!skipCamera) {
      window.setTimeout(() => void startScanner(), 150);
    }
  }

  return (
    <>
      <Nav
        title="Entrar al gym"
        actions={
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Volver
            </Button>
          </Link>
        }
      />

      <main className={styles.main}>
        {hasInitialToken ? (
          <>
            <p className={styles.eyebrow}>Registrando tu ingreso</p>
            <h1 className={styles.title}>
              {ui.kind === "submitting"
                ? "Validando tu ingreso…"
                : ui.kind === "result"
                ? ui.data.status === "granted"
                  ? `¡A entrenar, ${ui.data.user.name}!`
                  : "No pudimos registrarte"
                : "Tu ingreso"}
            </h1>
            <p className={styles.subtitle}>
              {ui.kind === "submitting"
                ? "Ya estamos confirmando tu entrada, no cierres la pantalla."
                : ui.kind === "result" && ui.data.status === "granted"
                ? "El personal ya te vio. Pasa tranquilo a la sala."
                : "Muestra este mensaje en recepción si hace falta."}
            </p>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>Escanea para ingresar</p>
            <h1 className={styles.title}>Apunta al QR de la pantalla</h1>
            <p className={styles.subtitle}>
              Abre la cámara y apunta al código que aparece en la pantalla del gym.
            </p>
          </>
        )}

        {!hasInitialToken && (
          <div className={styles.videoWrap}>
            <video ref={videoRef} playsInline muted />
            {ui.kind === "scanning" && <div className={styles.overlay} />}
          </div>
        )}

        <div className={styles.actions}>
          {ui.kind === "idle" && (
            <Button
              size="lg"
              fullWidth
              onClick={startScanner}
              leftIcon={<Camera size={18} />}
            >
              Abrir cámara
            </Button>
          )}

          {ui.kind === "scanning" && (
            <p className={styles.scanningText}>
              <ScanLine size={16} /> Buscando código…
            </p>
          )}

          {ui.kind === "submitting" && (
            <div
              className={
                hasInitialToken ? styles.submittingBig : styles.submitting
              }
            >
              <span className={styles.spinner} />
              <span>Validando tu ingreso…</span>
            </div>
          )}

          {ui.kind === "result" && (
            <div
              className={`${styles.result} ${
                ui.data.status === "granted"
                  ? isMembershipCritical(ui.data.membership.daysRemaining)
                    ? styles.grantedCritical
                    : styles.granted
                  : styles.denied
              }`}
            >
              <h3 className={styles.resultHeader}>
                {ui.data.status === "granted" ? (
                  isMembershipCritical(ui.data.membership.daysRemaining) ? (
                    <>
                      <AlertTriangle size={20} /> ¡Atención,{" "}
                      {ui.data.user.name}!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} /> ¡A entrenar, {ui.data.user.name}!
                    </>
                  )
                ) : (
                  <>
                    <XCircle size={20} /> Acceso denegado
                  </>
                )}
              </h3>
              <p className={styles.resultBody}>
                {ui.data.status === "granted" ? (
                  isMembershipCritical(ui.data.membership.daysRemaining) ? (
                    <>
                      Te quedan{" "}
                      <span className={styles.daysCritical}>
                        {ui.data.membership.daysRemaining}
                      </span>{" "}
                      día
                      {ui.data.membership.daysRemaining === 1 ? "" : "s"} de
                      membresía. {membershipCriticalScannerRenewHint()}
                    </>
                  ) : (
                    <span className={styles.resultBodyRow}>
                      <Dumbbell size={16} />
                      Te quedan{" "}
                      <strong>{ui.data.membership.daysRemaining}</strong> día
                      {ui.data.membership.daysRemaining === 1 ? "" : "s"} de
                      membresía. Aprovechalos.
                    </span>
                  )
                ) : (
                  ui.data.message
                )}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={reset}
                  leftIcon={<RotateCcw size={14} />}
                >
                  Escanear otro
                </Button>
              </div>
            </div>
          )}

          {ui.kind === "error" && (
            <div className={`${styles.result} ${styles.denied}`}>
              <h3 className={styles.resultHeader}>
                <XCircle size={20} /> Ups…
              </h3>
              <p className={styles.resultBody}>{ui.message}</p>
              <div style={{ marginTop: "0.75rem" }}>
                <Button
                  size="sm"
                  onClick={reset}
                  leftIcon={<RotateCcw size={14} />}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
