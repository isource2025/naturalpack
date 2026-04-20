import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { accessLogRepository } from "@/lib/repositories/accessLogRepository";

export const runtime = "nodejs";

/**
 * GET /api/admin/accesses?limit=50&cursor=<id>
 *
 * Lista accesos del gym del admin (granted y denied) ordenados por timestamp
 * desc. Incluye datos mínimos del user para la columna lista del módulo de
 * accesos. El detalle completo del socio se resuelve en /api/admin/users/[id].
 */
export const GET = handle(async (req: NextRequest) => {
  const session = requireAdmin();
  const { searchParams } = req.nextUrl;
  const limitRaw = searchParams.get("limit");
  const cursor = searchParams.get("cursor");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;

  const rows = await accessLogRepository.listByGym(session.gymId, {
    limit: Number.isFinite(limit) ? limit : 50,
    cursor: cursor || null,
  });

  const items = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    status: row.status as "granted" | "denied",
    reason: row.reason,
    timestamp: row.timestamp.toISOString(),
    user: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          photoUrl: row.user.photoUrl,
        }
      : null,
  }));

  const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;

  return ok({ items, nextCursor });
});
