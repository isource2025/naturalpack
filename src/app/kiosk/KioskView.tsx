"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { AnimatePresence, motion } from "framer-motion";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  Flame,
  AlertTriangle,
} from "lucide-react";
import {
  isMembershipCritical,
  membershipCriticalKioskHint,
  membershipCriticalKioskTitle,
} from "@/lib/membershipUi";
import KioskConfetti from "./KioskConfetti";
import styles from "./KioskView.module.css";

type AccessResult = {
  status: "granted" | "denied";
  user: { name: string; photoUrl: string | null };
  membership: { daysRemaining: number };
  message: string;
  gymId: string | null;
  kioskSessionId: string | null;
  timestamp: string;
};

type SessionState = {
  sessionId: string;
  gymId: string | null;
};

type TokenState = {
  token: string;
  expiresAt: number;
  qrDataUrl: string;
  scanUrl: string;
};

type UIState = { kind: "qr" } | { kind: "result"; data: AccessResult };

const RESET_MS = 6000;
const TOKEN_REFRESH_SAFETY_MS = 60_000;

const GRANTED_PHRASES = [
  "¡Todo listo, a entrenar 💣!",
  "A romperla 🔥",
  "Hoy se entrena fuerte 💪",
  "Dale con todo 🚀",
];

function pickPhrase(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % GRANTED_PHRASES.length;
  return GRANTED_PHRASES[idx];
}

export default function KioskView() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ui, setUi] = useState<UIState>({ kind: "qr" });

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStampRef = useRef<string | null>(null);

  // --- 1) Crear sesión de totem + resolver baseUrl pública ---
  // El gymId de la sesión lo decide el server a partir del JWT del admin.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sesRes, urlRes] = await Promise.all([
          fetch("/api/kiosk/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          }).then((r) => r.json()),
          fetch("/api/kiosk/public-url").then((r) => r.json()),
        ]);
        if (!sesRes.ok)
          throw new Error(sesRes.error?.message || "No se pudo crear sesión");
        if (!urlRes.ok)
          throw new Error(urlRes.error?.message || "No se pudo resolver baseUrl");
        if (cancelled) return;
        setSession(sesRes.data);
        setBaseUrl(urlRes.data.baseUrl);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error inicializando totem");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 2) Renovar token + regenerar QR en loop ---
  const refreshToken = useCallback(
    async (sessionId: string, base: string) => {
      try {
        const res = await fetch(
          `/api/kiosk/token?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!json.ok)
          throw new Error(json.error?.message || "No se pudo emitir token");
        const { token, expiresAt, ttlMs } = json.data as {
          token: string;
          expiresAt: number;
          ttlMs: number;
        };
        const scanUrl = `${base}/scan?token=${encodeURIComponent(token)}`;
        const qrDataUrl = await generateQrDataUrl(scanUrl);
        setTokenState({ token, expiresAt, qrDataUrl, scanUrl });

        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        const delay = Math.max(1000, ttlMs - TOKEN_REFRESH_SAFETY_MS);
        refreshTimer.current = setTimeout(() => refreshToken(sessionId, base), delay);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error emitiendo token");
      }
    },
    []
  );

  useEffect(() => {
    if (!session || !baseUrl) return;
    refreshToken(session.sessionId, baseUrl);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [session, baseUrl, refreshToken]);

  // --- 3) SSE filtrado por sessionId ---
  useEffect(() => {
    if (!session) return;
    const es = new EventSource(
      `/api/kiosk/stream?sessionId=${encodeURIComponent(session.sessionId)}`
    );

    es.addEventListener("ready", () => setConnected(true));
    es.addEventListener("access:result", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as AccessResult;
        applyResult(data);
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function applyResult(data: AccessResult) {
    if (lastStampRef.current === data.timestamp) return;
    lastStampRef.current = data.timestamp;
    setUi({ kind: "result", data });
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setUi({ kind: "qr" }), RESET_MS);
  }

  const scanUrlShort = useMemo(
    () => tokenState?.scanUrl.replace(/\/scan\?.*$/, "/scan") ?? "",
    [tokenState]
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ui.kind === "result" ? (
        <ResultScreen key={`r-${ui.data.timestamp}`} data={ui.data} />
      ) : (
        <IdleScreen
          key="idle"
          tokenState={tokenState}
          scanUrlShort={scanUrlShort}
          connected={connected}
          error={error}
        />
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Idle ------------------------------ */
function IdleScreen({
  tokenState,
  scanUrlShort,
  connected,
  error,
}: {
  tokenState: TokenState | null;
  scanUrlShort: string;
  connected: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      className={`${styles.kiosk} ${styles.idle}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.inner}>
        <span className={styles.eyebrow}>
          <Flame size={14} /> NaturalPack · Hoy se entrena
        </span>
        <h1 className={styles.title}>Escaneá para entrar</h1>
        <p className={styles.sub}>
          Abrí la cámara de tu teléfono y apuntá al QR.
        </p>

        <div className={styles.qrBox}>
          {tokenState ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={tokenState.qrDataUrl} alt="QR de acceso" />
          ) : (
            <div className={styles.qrLoading}>Generando QR…</div>
          )}
        </div>

        <div className={styles.steps}>
          <span className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <Smartphone size={14} /> Abrí tu cámara
          </span>
          <span className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <QrCode size={14} /> Apuntá al QR
          </span>
          <span className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <CheckCircle2 size={14} /> Listo, a entrenar
          </span>
        </div>

        {scanUrlShort && <p className={styles.url}>{scanUrlShort}</p>}

        <p className={styles.status}>
          <span
            className={`${styles.statusDot} ${
              connected ? styles.statusDotOk : ""
            }`}
          />
          {connected ? "En línea · tiempo real" : "Conectando…"}
          {error && <span className={styles.err}> · {error}</span>}
        </p>
      </div>
    </motion.div>
  );
}

/* ---------------------------- Result ---------------------------- */
function ResultScreen({ data }: { data: AccessResult }) {
  const granted = data.status === "granted";
  const low =
    granted && isMembershipCritical(data.membership.daysRemaining);
  const cls = granted
    ? low
      ? styles.grantedLow
      : styles.granted
    : styles.denied;
  const initial = data.user.name?.charAt(0)?.toUpperCase() ?? "?";
  const phrase = granted
    ? low
      ? membershipCriticalKioskTitle()
      : pickPhrase(data.timestamp)
    : data.message || "Acceso denegado";

  return (
    <motion.div
      className={`${styles.kiosk} ${cls}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {granted && !low && <KioskConfetti key={data.timestamp} />}

      <div className={styles.inner}>
        <motion.div
          className={styles.avatar}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
        >
          {data.user.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.user.photoUrl} alt={data.user.name} />
          ) : (
            <span>{initial}</span>
          )}
        </motion.div>

        <motion.span
          className={styles.resultBadge}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          {granted ? (
            low ? (
              <>
                <AlertTriangle size={18} /> Entrá — membresía por vencer
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Acceso permitido
              </>
            )
          ) : (
            <>
              <XCircle size={18} /> Acceso denegado
            </>
          )}
        </motion.span>

        <motion.h1
          className={`${styles.resultTitle} ${low ? styles.resultTitleWarn : ""}`}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          {granted ? phrase : "Membresía vencida 😔"}
        </motion.h1>

        {granted && low && (
          <motion.p
            className={styles.resultKioskWarn}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {membershipCriticalKioskHint(data.membership.daysRemaining)}
          </motion.p>
        )}

        <motion.p
          className={styles.resultName}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          {data.user.name}
        </motion.p>

        {granted ? (
          <motion.div
            className={`${styles.bigDays} ${low ? styles.bigDaysLow : ""}`}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            <span className={styles.bigDaysNum}>
              {data.membership.daysRemaining}
            </span>
            <span className={styles.bigDaysUnit}>
              día{data.membership.daysRemaining === 1 ? "" : "s"} para romperla
            </span>
          </motion.div>
        ) : (
          <motion.p
            className={styles.resultLine}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            {data.message}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#07090d", light: "#ffffff" },
  });
}
