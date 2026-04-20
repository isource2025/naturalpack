import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CashView from "./CashView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caja · NaturalPack" };

export default function AdminCashPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/cash");
  }
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Nav
        title="Caja"
        subtitle="Cierres y pagos por día"
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
        <CashView />
      </main>
    </>
  );
}
