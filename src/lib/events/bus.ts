import { EventEmitter } from "node:events";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

/**
 * Bus de eventos in-memory para el MVP.
 * Escalar a múltiples instancias: reemplazar por Redis pub/sub o similar.
 * La interfaz pública (subscribe/publish) no cambia al migrar.
 */
class AppBus extends EventEmitter {}

const globalKey = "__np_event_bus__" as const;
type GlobalWithBus = typeof globalThis & { [globalKey]?: AppBus };
const g = globalThis as GlobalWithBus;

export const bus: AppBus = g[globalKey] ?? new AppBus();
bus.setMaxListeners(100);
if (!g[globalKey]) g[globalKey] = bus;

// -----------------------------------------------------------
// Tipado de eventos del dominio
// -----------------------------------------------------------
export type AccessResultPayload = {
  status: "granted" | "denied";
  user: { name: string; photoUrl: string | null };
  membership: { daysRemaining: number };
  message: string;
  gymId: string | null;
  /** Kiosk al que va dirigido el evento. null = broadcast (p.ej. lector hardware legacy). */
  kioskSessionId: string | null;
  timestamp: string;
};

export const EVENTS = {
  ACCESS_RESULT: "access:result",
} as const;

/**
 * Último resultado por gym + último absoluto (para /api/access/last).
 * Se mantiene in-memory. Si se escala a múltiples instancias, mover a Redis.
 */
const lastByGym = new Map<string, AccessResultPayload>();
let lastAny: AccessResultPayload | null = null;

export async function publishAccessResult(payload: AccessResultPayload) {
  if (payload.gymId) lastByGym.set(payload.gymId, payload);
  lastAny = payload;
  bus.emit(EVENTS.ACCESS_RESULT, payload);
  if (payload.kioskSessionId) {
    await prisma.kioskLiveResult.upsert({
      where: { sessionId: payload.kioskSessionId },
      create: {
        sessionId: payload.kioskSessionId,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
      update: {
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export function getLastAccessResult(gymId?: string | null): AccessResultPayload | null {
  if (gymId) return lastByGym.get(gymId) ?? null;
  return lastAny;
}
