import { NextRequest } from "next/server";
import os from "node:os";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/kiosk/public-url
 *
 * Devuelve la baseUrl que el kiosk debe embeber en el QR.
 *
 * Estrategia:
 *  1. Si PUBLIC_BASE_URL está definida, la usamos (útil en prod, túneles, dominios).
 *  2. Si el host de la request es un nombre ruteable (ej. IP LAN, dominio), lo usamos.
 *  3. Si el host es localhost/127.0.0.1, sustituimos por la IP LAN IPv4 detectada.
 *  4. Fallback: devolvemos el origin tal cual.
 */
export const GET = handle(async (req: NextRequest) => {
  const override = process.env.PUBLIC_BASE_URL?.trim();
  if (override) {
    return ok({ baseUrl: stripTrailingSlash(override), source: "env" });
  }

  const origin = req.nextUrl.origin; // ej. "http://localhost:3000"
  const hostname = req.nextUrl.hostname;
  const port = req.nextUrl.port || (req.nextUrl.protocol === "https:" ? "443" : "80");
  const proto = req.nextUrl.protocol.replace(":", "");

  if (isLoopback(hostname)) {
    const lanIp = getLanIpv4();
    if (lanIp) {
      const baseUrl = `${proto}://${lanIp}:${port}`;
      return ok({ baseUrl, source: "lan", lanIp });
    }
  }

  return ok({ baseUrl: origin, source: "request" });
});

function isLoopback(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.startsWith("127.")
  );
}

function getLanIpv4(): string | null {
  const nets = os.networkInterfaces();
  const candidates: string[] = [];
  for (const name of Object.keys(nets)) {
    const addrs = nets[name] ?? [];
    for (const net of addrs) {
      if (net.family !== "IPv4" || net.internal) continue;
      candidates.push(net.address);
    }
  }
  // Priorizar rangos LAN típicos: 192.168.x / 10.x / 172.16-31.x
  const priority = (ip: string) => {
    if (ip.startsWith("192.168.")) return 0;
    if (ip.startsWith("10.")) return 1;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
    return 3;
  };
  candidates.sort((a, b) => priority(a) - priority(b));
  return candidates[0] ?? null;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
