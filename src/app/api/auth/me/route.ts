import { requireSession } from "@/lib/auth";
import { authService } from "@/lib/services/authService";
import { qrToDataUrl } from "@/lib/qr";
import { handle, ok } from "@/lib/http";

export const runtime = "nodejs";

export const GET = handle(async () => {
  const session = requireSession();
  const me = await authService.me(session);
  const qrDataUrl = me.qrCode ? await qrToDataUrl(me.qrCode) : null;
  return ok({ ...me, qrDataUrl });
});
