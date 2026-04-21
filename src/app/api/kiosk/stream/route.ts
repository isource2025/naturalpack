import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { bus, EVENTS, type AccessResultPayload } from "@/lib/events/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = 900;

/**
 * GET /api/kiosk/stream?sessionId=...  (recomendado, flujo nuevo)
 * GET /api/kiosk/stream?gymId=...      (legacy, hardware reader broadcast)
 *
 * Server-Sent Events para el modo Kiosk.
 * - Misma instancia: EventEmitter en memoria.
 * - Vercel / varias instancias: el resultado se persiste en DB y este handler
 *   hace polling para que el totem reciba access:result aunque el check-in
 *   haya corrido en otro lambda.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const gymId = req.nextUrl.searchParams.get("gymId");
  const encoder = new TextEncoder();
  /** No reenviar resultados viejos al abrir el stream (evita flash de un ingreso anterior). */
  const streamOpenedAtMs = Date.now() - 1500;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      send("ready", { ok: true, sessionId, ts: new Date().toISOString() });

      let lastSentTimestamp: string | null = null;

      const deliver = (payload: AccessResultPayload) => {
        if (sessionId) {
          if (payload.kioskSessionId && payload.kioskSessionId !== sessionId) {
            return;
          }
        } else if (gymId && payload.gymId && payload.gymId !== gymId) {
          return;
        }
        if (payload.timestamp === lastSentTimestamp) return;
        lastSentTimestamp = payload.timestamp;
        send(EVENTS.ACCESS_RESULT, payload);
      };

      const onResult = (payload: AccessResultPayload) => {
        deliver(payload);
      };
      bus.on(EVENTS.ACCESS_RESULT, onResult);

      const pollFromDb = async () => {
        if (!sessionId) return;
        try {
          const row = await prisma.kioskLiveResult.findUnique({
            where: { sessionId },
          });
          if (!row) return;
          if (row.updatedAt.getTime() < streamOpenedAtMs) return;
          const payload = row.payload as AccessResultPayload;
          deliver(payload);
        } catch {
          /* canal o DB caída */
        }
      };

      const pollTimer = sessionId
        ? setInterval(() => {
            void pollFromDb();
          }, POLL_MS)
        : null;

      void pollFromDb();

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          /* canal cerrado */
        }
      }, 15000);

      const close = () => {
        if (pollTimer) clearInterval(pollTimer);
        clearInterval(heartbeat);
        bus.off(EVENTS.ACCESS_RESULT, onResult);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
