import crypto from "node:crypto";
import { prisma } from "../db";
import { NotFoundError, ValidationError } from "../errors";

/**
 * Gestión de sesiones de kiosk y tokens rotativos para el QR.
 *
 * - Un "kiosk session" representa una pantalla montada en el gym.
 * - Esa sesión emite tokens de corta vida que se embeben en el QR mostrado.
 * - Cada token es válido hasta su expiración (mismo QR para varios socios en el día).
 *
 * Persistido en PostgreSQL para serverless (Vercel): todas las instancias comparten estado.
 */

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
export const KIOSK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function randomId(prefix: string, bytes: number): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString("base64url")}`;
}

async function gcExpiredTokens(now = new Date()) {
  await prisma.kioskToken.deleteMany({
    where: { expiresAt: { lte: now } },
  });
}

async function gcStaleSessions(now = Date.now()) {
  const cutoff = new Date(now - SESSION_TTL_MS);
  await prisma.kioskSession.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}

async function gcFull() {
  const now = new Date();
  await gcExpiredTokens(now);
  await gcStaleSessions(now.getTime());
}

export const kioskService = {
  async createSession(gymId: string | null) {
    await gcFull();
    const session = await prisma.kioskSession.create({
      data: {
        id: randomId("ks", 12),
        gymId: gymId ?? undefined,
      },
    });
    return { sessionId: session.id, gymId: session.gymId };
  },

  /**
   * Emite un token nuevo para una sesión. Vive 24h; la pantalla puede rotar tokens.
   */
  async issueToken(sessionId: string) {
    await gcFull();
    const exists = await prisma.kioskSession.findUnique({
      where: { id: sessionId },
    });
    if (!exists) {
      throw new NotFoundError("La sesión de kiosk no existe o expiró");
    }
    const token = randomId("kq", 18);
    const expiresAt = new Date(Date.now() + KIOSK_TOKEN_TTL_MS);
    await prisma.kioskToken.create({
      data: { token, sessionId, expiresAt },
    });
    return { token, expiresAt: expiresAt.getTime(), ttlMs: KIOSK_TOKEN_TTL_MS };
  },

  /**
   * Valida un token de kiosk (multi-uso hasta su TTL).
   */
  async validateToken(
    token: string
  ): Promise<{ sessionId: string; gymId: string | null }> {
    await gcExpiredTokens();
    const rec = await prisma.kioskToken.findUnique({
      where: { token },
      include: { session: true },
    });
    if (!rec) throw new ValidationError("QR inválido");
    const now = new Date();
    if (rec.expiresAt < now) {
      await prisma.kioskToken.delete({ where: { token } }).catch(() => {
        /* ya borrado */
      });
      throw new ValidationError("QR expirado, espera al próximo en la pantalla");
    }
    if (!rec.session) throw new ValidationError("Sesión de kiosk finalizada");
    return { sessionId: rec.sessionId, gymId: rec.session.gymId };
  },

  /**
   * Sesión de kiosk más reciente para el gym (o sesión genérica sin gymId).
   */
  async findLatestSessionByGym(gymId: string | null): Promise<{
    sessionId: string;
    gymId: string | null;
  } | null> {
    await gcFull();
    const minCreated = new Date(Date.now() - SESSION_TTL_MS);
    const base = { createdAt: { gte: minCreated } } as const;
    const row =
      gymId != null
        ? await prisma.kioskSession.findFirst({
            where: {
              ...base,
              OR: [{ gymId }, { gymId: null }],
            },
            orderBy: { createdAt: "desc" },
          })
        : await prisma.kioskSession.findFirst({
            where: base,
            orderBy: { createdAt: "desc" },
          });
    return row ? { sessionId: row.id, gymId: row.gymId } : null;
  },
};
