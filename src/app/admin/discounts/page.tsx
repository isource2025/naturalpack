import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DiscountsView from "./DiscountsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Descuentos · NaturalPack" };

export default function AdminDiscountsPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/discounts");
  }
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Nav
        title="Descuentos"
        subtitle="Automáticos y por código único"
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
        <DiscountsView />
      </main>
    </>
  );
}
