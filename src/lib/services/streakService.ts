import { accessLogRepository } from "../repositories/accessLogRepository";
import { trainingSessionRepository } from "../repositories/trainingSessionRepository";

/**
 * Servicio de cálculo de racha semanal.
 *
 * Regla: la racha se mantiene mientras cada semana completa (lunes–domingo,
 * hora local) haya tenido al menos `WEEK_GOAL` días distintos con acceso
 * "granted". La semana actual cuenta como "en progreso" y todavía no puede
 * romper la racha.
 *
 * Unidad retornada: `streakDays` = cantidad total de días distintos con
 * asistencia dentro de la cadena actual de semanas válidas.
 */

const WEEK_GOAL = 2;
// Cuántas semanas pasadas miramos como máximo. 26 semanas = ~6 meses.
const LOOKBACK_WEEKS = 26;

export type StreakStatus = "active" | "at_risk" | "broken";

export type StreakInfo = {
  streakDays: number;
  streakWeeks: number;
  daysThisWeek: number;
  neededThisWeek: number;
  weekGoal: number;
  status: StreakStatus;
  longestStreakDays: number;
  weekStartISO: string;
  weekEndISO: string;
};

function startOfLocalDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Devuelve el lunes 00:00 local de la semana de `d`. */
function startOfWeek(d: Date): Date {
  const r = startOfLocalDay(d);
  const day = r.getDay(); // 0 = domingo
  const offset = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + offset);
  return r;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekKey(d: Date): string {
  return dayKey(startOfWeek(d));
}

export const streakService = {
  async compute(userId: string, now: Date = new Date()): Promise<StreakInfo> {
    const weekStart = startOfWeek(now);
    const since = addDays(weekStart, -7 * LOOKBACK_WEEKS);

    const rows = await accessLogRepository.grantedTimestamps(userId, since);
    const completedRows = await trainingSessionRepository.completedTimestamps(userId, since);

    // Agrupamos en semanas → set de días distintos.
    const byWeek = new Map<string, Set<string>>();
    for (const { timestamp } of rows) {
      const wk = weekKey(timestamp);
      const dk = dayKey(timestamp);
      let s = byWeek.get(wk);
      if (!s) {
        s = new Set();
        byWeek.set(wk, s);
      }
      s.add(dk);
    }
    for (const { completedAt } of completedRows) {
      const wk = weekKey(completedAt);
      const dk = dayKey(completedAt);
      let s = byWeek.get(wk);
      if (!s) {
        s = new Set();
        byWeek.set(wk, s);
      }
      s.add(dk);
    }

    // Recorremos hacia atrás desde la semana actual.
    const thisWeekKey = dayKey(weekStart);
    const daysThisWeek = (byWeek.get(thisWeekKey)?.size ?? 0);

    let streakDays = daysThisWeek;
    let streakWeeks = daysThisWeek > 0 ? 1 : 0;

    // Si la semana actual ya cumple el goal, es parte firme; si no, igual la
    // arrastramos pero solo se considera "unida" con pasadas si hay pasadas
    // válidas consecutivas.
    for (let i = 1; i <= LOOKBACK_WEEKS; i++) {
      const wk = dayKey(addDays(weekStart, -7 * i));
      const bucket = byWeek.get(wk);
      const count = bucket?.size ?? 0;
      if (count < WEEK_GOAL) break; // semana rota → cadena termina
      streakDays += count;
      streakWeeks += 1;
    }

    // Longest streak histórico: sliding de semanas válidas en la ventana.
    let longestStreakDays = 0;
    let runDays = 0;
    // Ordenamos keys de semanas de más vieja a más nueva para hacer el run.
    const sortedKeys = Array.from(byWeek.keys()).sort();
    for (const k of sortedKeys) {
      const size = byWeek.get(k)?.size ?? 0;
      // Una semana se considera "válida para cadena histórica" si cumple goal
      // o si es la semana actual y ya tiene ≥1 (para reflejar el presente).
      const isCurrent = k === thisWeekKey;
      const counts = size >= WEEK_GOAL || (isCurrent && size > 0);
      if (counts) {
        runDays += size;
        if (runDays > longestStreakDays) longestStreakDays = runDays;
      } else {
        runDays = 0;
      }
    }
    // La racha actual también es candidata al máximo.
    if (streakDays > longestStreakDays) longestStreakDays = streakDays;

    const neededThisWeek = Math.max(0, WEEK_GOAL - daysThisWeek);

    let status: StreakStatus;
    if (streakDays === 0) status = "broken";
    else if (daysThisWeek >= WEEK_GOAL) status = "active";
    else status = "at_risk";

    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    return {
      streakDays,
      streakWeeks,
      daysThisWeek,
      neededThisWeek,
      weekGoal: WEEK_GOAL,
      status,
      longestStreakDays,
      weekStartISO: weekStart.toISOString(),
      weekEndISO: weekEnd.toISOString(),
    };
  },
};
