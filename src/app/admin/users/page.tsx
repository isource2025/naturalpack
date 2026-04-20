import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ClientsList from "./ClientsList";

export const dynamic = "force-dynamic";

export default function AdminUsersListPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/users");
  }
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <>
      <Nav
        title="Socios"
        actions={
          <>
            <Badge tone="brand" dot>
              Admin
            </Badge>
            <Link href="/admin/users/new">
              <Button size="sm" leftIcon={<UserPlus size={14} />}>
                Nuevo socio
              </Button>
            </Link>
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

      <main className="container">
        <h1 style={{ marginBottom: "0.25rem" }}>Lista de clientes</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Todos los socios de tu gym y el estado actual de su membresía.
        </p>
        <ClientsList />
      </main>
    </>
  );
}
