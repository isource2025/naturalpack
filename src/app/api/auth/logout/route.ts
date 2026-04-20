import { AUTH_COOKIE } from "@/lib/auth";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";

export const POST = handle(async () => {
  const res = ok({ loggedOut: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
