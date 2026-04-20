import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AccessesView from "./AccessesView";

export const dynamic = "force-dynamic";

export default function AccessesPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/accesses");
  }
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <>
      <Nav
        title="Accesos"
        actions={
          <>
            <Badge tone="brand" dot>
              Admin
            </Badge>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Volver
              </Button>
            </Link>
          </>
        }
      />
      <AccessesView gymId={session.gymId} />
    </>
  );
}
