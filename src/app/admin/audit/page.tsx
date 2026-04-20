import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AuditView from "./AuditView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Auditoría · NaturalPack" };

export default function AdminAuditPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/audit");
  }
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Nav
        title="Auditoría interna"
        subtitle="Quién hizo qué y cuándo"
        actions={
          <>
            <Badge tone="brand" dot>
              Admin
            </Badge>
            <Link href="/dashboard">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
              >
                Volver
              </Button>
            </Link>
          </>
        }
      />
      <main className="container" style={{ maxWidth: 860 }}>
        <AuditView />
      </main>
    </>
  );
}
