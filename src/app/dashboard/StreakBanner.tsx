"use client";

import { useEffect, useState } from "react";
import { Flame, Info, TrendingUp } from "lucide-react";
import styles from "./StreakBanner.module.css";

type StreakInfo = {
  streakDays: number;
  streakWeeks: number;
  daysThisWeek: number;
  neededThisWeek: number;
  weekGoal: number;
  status: "active" | "at_risk" | "broken";
  longestStreakDays: number;
  weekStartISO: string;
  weekEndISO: string;
};

function title(s: StreakInfo, first: string) {
  if (s.status === "active") {
    return `¡On fire, ${first}! 🔥`;
  }
  if (s.status === "at_risk" && s.streakDays > 0) {
    return `¡Cuidado con tu racha!`;
  }
  if (s.daysThisWeek === 1) return `¡Suma otra esta semana!`;
  return `Arranca tu racha 💪`;
}

function subtitle(s: StreakInfo) {
  if (s.status === "active") {
    return `Vas ${s.daysThisWeek} veces esta semana. ${s.streakWeeks} semana${s.streakWeeks === 1 ? "" : "s"} seguidas en racha.`;
  }
  if (s.status === "at_risk" && s.neededThisWeek > 0) {
    return `Te falta${s.neededThisWeek === 1 ? "" : "n"} ${s.neededThisWeek} visita${s.neededThisWeek === 1 ? "" : "s"} para mantener la racha esta semana.`;
  }
  if (s.daysThisWeek === 1) {
    return `Con ${s.weekGoal} entradas por semana mantienes la racha.`;
  }
  return `Entrena al menos ${s.weekGoal} veces esta semana para arrancar.`;
}

export default function StreakBanner({ firstName }: { firstName: string }) {
  const [info, setInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/streak", { cache: "no-store" });
        const body = await res.json();
        if (cancelled) return;
        if (body?.ok) setInfo(body.data as StreakInfo);
        else setError(body?.error?.message || "No se pudo cargar la racha");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error de red");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !info) {
    return (
      <div className={`${styles.wrap} ${styles.loading}`} aria-busy>
        <div className={styles.flameBox}>
          <Flame size={22} />
        </div>
        <div className={styles.body}>
          <p className={styles.title}>Calculando tu racha…</p>
          <p className={styles.sub}>Un segundo 💪</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return null; // no rompemos el dashboard si falla el endpoint
  }

  const cls =
    info.status === "active"
      ? styles.active
      : info.status === "at_risk"
      ? styles.atRisk
      : styles.broken;

  const progress =
    info.weekGoal > 0
      ? Math.min(100, Math.round((info.daysThisWeek / info.weekGoal) * 100))
      : 0;

  return (
    <div className={`${styles.wrap} ${cls}`} aria-label="Racha semanal">
      <div className={styles.flameBox}>
        <Flame size={26} />
      </div>
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.count}>{info.streakDays}</span>
          <span className={styles.unit}>
            día{info.streakDays === 1 ? "" : "s"} en racha
          </span>
        </div>
        <p className={styles.title}>{title(info, firstName)}</p>
        <p className={styles.sub}>{subtitle(info)}</p>
        <div className={styles.bar} aria-hidden>
          <div className={styles.barFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.meta}>
          {info.longestStreakDays > info.streakDays ? (
            <>
              <TrendingUp size={12} /> Tu récord: {info.longestStreakDays} días
            </>
          ) : (
            <>
              <Info size={12} /> Meta: {info.weekGoal}×/semana · {info.daysThisWeek}/{info.weekGoal} esta semana
            </>
          )}
        </div>
      </div>
    </div>
  );
}
