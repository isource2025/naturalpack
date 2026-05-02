import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PaymentsView from "./PaymentsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagos · NaturalPack" };

export default function AdminPaymentsPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/payments");
  }
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Nav
        title="Pagos"
        subtitle="Acepta pagos y extiende la membresía"
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
        <PaymentsView />
      </main>
    </>
  );
}
