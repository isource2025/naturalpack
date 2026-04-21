"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
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
  gymName: string;
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

/** Frases del idle del totem; una al azar en cada F5 y tras cada ingreso. */
const IDLE_PHRASE_TEMPLATES = [
  (name: string) => `¡En ${name} hoy se entrena con todo!`,
  (name: string) => `¡${name} te espera — a romperla!`,
  (name: string) => `Fuego en ${name}: escaneá y entrá 🔥`,
  (name: string) => `Hoy el piso tiembla en ${name} 💪`,
  (name: string) => `¡${name} no perdona — vamos con todo!`,
  (name: string) => `Modo bestia activado en ${name} 🚀`,
  (name: string) => `¿Listo? ${name} te espera del otro lado 💣`,
  (name: string) => `Entrá a ${name} y dejá todo en la pista`,
  (name: string) => `Hoy sí o sí hay entreno en ${name}`,
  (name: string) => `¡Dale gas en ${name}, campeón!`,
] as const;

function randomIdleHeadline(gymName: string): string {
  const i = Math.floor(Math.random() * IDLE_PHRASE_TEMPLATES.length);
  const pick = IDLE_PHRASE_TEMPLATES[i] ?? IDLE_PHRASE_TEMPLATES[0];
  return pick(gymName);
}

export default function KioskView() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ui, setUi] = useState<UIState>({ kind: "qr" });
  /** Un solo titular estable hasta F5 o hasta rotar tras un ingreso (evita flash "Tu gimnasio" → nombre real). */
  const [idleHeadline, setIdleHeadline] = useState<string | null>(null);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStampRef = useRef<string | null>(null);
  const sessionRef = useRef<SessionState | null>(null);

  // --- 1) Sesión de totem (reutiliza la del gym si sigue vigente) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sesRes = await fetch("/api/kiosk/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }).then((r) => r.json());
        if (!sesRes.ok)
          throw new Error(sesRes.error?.message || "No se pudo crear sesión");
        if (cancelled) return;
        setSession(sesRes.data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error inicializando totem");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  /** Primera frase aleatoria solo cuando ya tenemos el nombre real del gym (no antes). */
  useEffect(() => {
    if (!session) return;
    setIdleHeadline((prev) =>
      prev === null ? randomIdleHeadline(session.gymName) : prev
    );
  }, [session]);

  // --- 2) Token + QR desde el backend (mismo token hasta que venza) ---
  const refreshToken = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(
        `/api/kiosk/token?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!json.ok)
        throw new Error(json.error?.message || "No se pudo emitir token");
      const { token, expiresAt, ttlMs, scanUrl, qrDataUrl } = json.data as {
        token: string;
        expiresAt: number;
        ttlMs: number;
        scanUrl: string;
        qrDataUrl: string;
      };
      setTokenState({ token, expiresAt, qrDataUrl, scanUrl });

      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const delay = Math.max(1000, ttlMs - TOKEN_REFRESH_SAFETY_MS);
      refreshTimer.current = setTimeout(() => refreshToken(sessionId), delay);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error emitiendo token");
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void refreshToken(session.sessionId);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [session, refreshToken]);

  // --- 3) SSE filtrado por sessionId ---
  useEffect(() => {
    if (!session) return;
    const es = new EventSource(
      `/api/kiosk/stream?sessionId=${encodeURIComponent(session.sessionId)}`
    );

    es.addEventListener("access:result", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as AccessResult;
        applyResult(data);
      } catch {
        /* ignore */
      }
    });
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
    resetTimer.current = setTimeout(() => {
      const s = sessionRef.current;
      if (s) setIdleHeadline(randomIdleHeadline(s.gymName));
      setUi({ kind: "qr" });
    }, RESET_MS);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ui.kind === "result" ? (
        <ResultScreen key={`r-${ui.data.timestamp}`} data={ui.data} />
      ) : (
        <IdleScreen
          key="idle"
          tokenState={tokenState}
          headline={idleHeadline}
          error={error}
        />
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Idle ------------------------------ */
function IdleScreen({
  tokenState,
  headline,
  error,
}: {
  tokenState: TokenState | null;
  headline: string | null;
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
      <div className={`${styles.inner} ${styles.idleInner}`}>
        <div className={styles.idleGrid}>
          <div className={styles.idleLeft}>
            <h1 className={`${styles.title} ${styles.idleTitle}`}>
              {headline ?? "\u00A0"}
            </h1>
            <p className={styles.sub}>
              Abrí la cámara, apuntá al código y listo.
            </p>

            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <Smartphone className={styles.stepIcon} size={28} strokeWidth={2} />
                <span className={styles.stepText}>Abrí tu cámara</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <QrCode className={styles.stepIcon} size={28} strokeWidth={2} />
                <span className={styles.stepText}>Apuntá al QR</span>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <CheckCircle2 className={styles.stepIcon} size={28} strokeWidth={2} />
                <span className={styles.stepText}>¡A entrenar!</span>
              </div>
            </div>

            {error && <p className={styles.idleError}>{error}</p>}
          </div>

          <div className={styles.idleRight}>
            <div className={styles.qrBox}>
              {tokenState ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={tokenState.qrDataUrl} alt="QR de acceso" />
              ) : (
                <div className={styles.qrLoading}>Generando QR…</div>
              )}
            </div>
          </div>
        </div>
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

