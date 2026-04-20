import { NextRequest } from "next/server";
import { LoginDTO } from "@/lib/dtos";
import { authService } from "@/lib/services/authService";
import { AUTH_COOKIE } from "@/lib/auth";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";

export const POST = handle(async (req: NextRequest) => {
  const body = await req.json();
  const input = LoginDTO.parse(body);
  const { token, user } = await authService.login(input);

  const res = ok({ user });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
});
