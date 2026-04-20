import crypto from "node:crypto";
import { NotFoundError, ValidationError } from "../errors";

/**
 * Gestión de sesiones de kiosk y tokens rotativos para el QR.
 *
 * - Un "kiosk session" representa una pantalla montada en el gym.
 * - Esa sesión emite tokens de corta vida que se embeben en el QR mostrado.
 * - Cada token es single-use y se invalida al consumirse (check-in) o al expirar.
 *
 * Storage in-memory (MVP). Para escalar a múltiples instancias:
 * mover a Redis con el mismo contrato público.
 */

type KioskSession = {
  id: string;
  gymId: string | null;
  createdAt: number;
};

type KioskTokenRecord = {
  token: string;
  sessionId: string;
  expiresAt: number;
};

type KioskStore = {
  sessions: Map<string, KioskSession>;
  tokens: Map<string, KioskTokenRecord>;
};

const GLOBAL_KEY = "__np_kiosk_store__" as const;
type G = typeof globalThis & { [GLOBAL_KEY]?: KioskStore };
const g = globalThis as G;

const store: KioskStore =
  g[GLOBAL_KEY] ??
  ({
    sessions: new Map<string, KioskSession>(),
    tokens: new Map<string, KioskTokenRecord>(),
  } satisfies KioskStore);
if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = store;

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días (las pantallas quedan montadas)
export const KIOSK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h: el QR se renueva a diario

function gc(now = Date.now()) {
  for (const [k, t] of store.tokens) if (t.expiresAt <= now) store.tokens.delete(k);
  for (const [k, s] of store.sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) store.sessions.delete(k);
  }
}

function randomId(prefix: string, bytes: number): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString("base64url")}`;
}

export const kioskService = {
  createSession(gymId: string | null) {
    gc();
    const session: KioskSession = {
      id: randomId("ks", 12),
      gymId,
      createdAt: Date.now(),
    };
    store.sessions.set(session.id, session);
    return { sessionId: session.id, gymId: session.gymId };
  },

  sessionExists(sessionId: string) {
    gc();
    return store.sessions.has(sessionId);
  },

  /**
   * Emite un token nuevo para una sesión. Vive 24h y puede usarse múltiples veces
   * (distintos socios lo escanean a lo largo del día). Los anteriores siguen
   * vigentes hasta su propio TTL, pero la pantalla siempre muestra el último.
   */
  issueToken(sessionId: string) {
    gc();
    if (!store.sessions.has(sessionId)) {
      throw new NotFoundError("La sesión de kiosk no existe o expiró");
    }
    const token = randomId("kq", 18);
    const expiresAt = Date.now() + KIOSK_TOKEN_TTL_MS;
    store.tokens.set(token, { token, sessionId, expiresAt });
    return { token, expiresAt, ttlMs: KIOSK_TOKEN_TTL_MS };
  },

  /**
   * Valida un token de kiosk (multi-uso, válido hasta su TTL).
   * No lo elimina: el mismo QR puede escanearse por múltiples socios en el día.
   * Cada check-in queda registrado individualmente en AccessLog.
   */
  validateToken(token: string): { sessionId: string; gymId: string | null } {
    gc();
    const rec = store.tokens.get(token);
    if (!rec) throw new ValidationError("QR inválido");
    if (rec.expiresAt < Date.now()) {
      store.tokens.delete(token);
      throw new ValidationError("QR expirado, espera al próximo en la pantalla");
    }
    const session = store.sessions.get(rec.sessionId);
    if (!session) throw new ValidationError("Sesión de kiosk finalizada");
    return { sessionId: rec.sessionId, gymId: session.gymId };
  },

  /**
   * Devuelve la sesión de kiosk más reciente que coincida con el gymId dado.
   * Se usa para el flujo "Avisar al personal": el socio aprieta un botón en su
   * app y necesitamos saber a qué pantalla del gym notificar.
   *
   * Matching:
   *  - Si la sesión tiene gymId y coincide → match.
   *  - Si la sesión no tiene gymId (pantalla genérica) → también se acepta,
   *    para no dejar al socio sin ruta en ambientes de demo.
   *
   * Devuelve null si no hay sesiones activas.
   */
  findLatestSessionByGym(gymId: string | null): {
    sessionId: string;
    gymId: string | null;
  } | null {
    gc();
    let best: KioskSession | null = null;
    for (const s of store.sessions.values()) {
      const matches = gymId ? s.gymId === gymId || s.gymId === null : true;
      if (!matches) continue;
      if (!best || s.createdAt > best.createdAt) best = s;
    }
    return best ? { sessionId: best.id, gymId: best.gymId } : null;
  },
};
