import { redirect } from "next/navigation";
import { ShieldHalf } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { authService } from "@/lib/services/authService";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import UserMenu from "../dashboard/UserMenu";
import PlatformView from "./PlatformView";

export const metadata = { title: "Plataforma · NaturalPack" };
export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/platform");
  }
  if (session.role !== "superadmin") {
    redirect("/dashboard");
  }

  const me = await authService.me(session);

  return (
    <>
      <Nav
        title="NaturalPack"
        subtitle="Plataforma"
        brandHref="/platform"
        actions={
          <>
            <Badge tone="brand" dot>
              <ShieldHalf size={12} /> Superadmin
            </Badge>
            <UserMenu name={me.name} email={me.email} role="superadmin" />
          </>
        }
      />

      <main className="container">
        <PlatformView />
      </main>
    </>
  );
}
