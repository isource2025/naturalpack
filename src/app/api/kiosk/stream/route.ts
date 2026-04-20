import { NextRequest } from "next/server";
import { bus, EVENTS, type AccessResultPayload } from "@/lib/events/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kiosk/stream?sessionId=...  (recomendado, flujo nuevo)
 * GET /api/kiosk/stream?gymId=...      (legacy, hardware reader broadcast)
 *
 * Server-Sent Events para el modo Kiosk.
 * Solo reenvía eventos que correspondan al filtro.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const gymId = req.nextUrl.searchParams.get("gymId");
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      send("ready", { ok: true, sessionId, ts: new Date().toISOString() });

      const onResult = (payload: AccessResultPayload) => {
        if (sessionId) {
          // El kiosk solo quiere sus propios eventos (o broadcasts globales).
          if (payload.kioskSessionId && payload.kioskSessionId !== sessionId) return;
        } else if (gymId && payload.gymId && payload.gymId !== gymId) {
          return;
        }
        send(EVENTS.ACCESS_RESULT, payload);
      };
      bus.on(EVENTS.ACCESS_RESULT, onResult);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          /* canal cerrado */
        }
      }, 15000);

      const close = () => {
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
