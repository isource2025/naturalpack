import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import KioskView from "./KioskView";

export const metadata = { title: "Totem · NaturalPack" };
export const dynamic = "force-dynamic";

/**
 * El totem es la pantalla de entrada del gimnasio (fullscreen con QR rotativo).
 * Solo tiene sentido para el admin del gym: si un socio la abriera, vería un
 * QR que no le pertenece. Guardamos la ruta en el servidor.
 *
 * El gymId que usa la sesión de totem se toma SIEMPRE del JWT del admin
 * (lado server en /api/kiosk/session), nunca de querystring.
 */
export default function KioskPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/kiosk");
  }
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return <KioskView />;
}
