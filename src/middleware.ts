import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Middleware de protección liviano (edge runtime).
 * No verifica la firma JWT aquí (jsonwebtoken no es edge-safe);
 * solo comprueba la presencia de la cookie. La verificación real
 * ocurre en los handlers vía requireSession().
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/accesses") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/platform");

  if (isProtectedPage) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      // Preservamos path + query (p.ej. /scan?token=kq_xxx) para que
      // después del login el router nos devuelva EXACTAMENTE al destino.
      const target = pathname + (req.nextUrl.search || "");
      url.search = "";
      url.searchParams.set("next", target);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scan/:path*",
    "/accesses/:path*",
    "/admin/:path*",
    "/platform/:path*",
  ],
};
