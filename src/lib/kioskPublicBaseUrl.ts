import type { NextRequest } from "next/server";
import os from "node:os";

/**
 * Resolución de la URL pública base para enlaces del QR del kiosk.
 * Misma lógica que GET /api/kiosk/public-url.
 */
export function resolveKioskPublicUrl(req: NextRequest): {
  baseUrl: string;
  source: "env" | "lan" | "request";
  lanIp?: string;
} {
  const override = process.env.PUBLIC_BASE_URL?.trim();
  if (override) {
    return { baseUrl: stripTrailingSlash(override), source: "env" };
  }

  const origin = req.nextUrl.origin;
  const hostname = req.nextUrl.hostname;
  const port =
    req.nextUrl.port || (req.nextUrl.protocol === "https:" ? "443" : "80");
  const proto = req.nextUrl.protocol.replace(":", "");

  if (isLoopback(hostname)) {
    const lanIp = getLanIpv4();
    if (lanIp) {
      return {
        baseUrl: `${proto}://${lanIp}:${port}`,
        source: "lan",
        lanIp,
      };
    }
  }

  return { baseUrl: origin, source: "request" };
}

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
