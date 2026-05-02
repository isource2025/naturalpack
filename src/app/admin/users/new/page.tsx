import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NewUserForm from "./NewUserForm";

export const dynamic = "force-dynamic";

export default function AdminNewUserPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/admin/users/new");
  }
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <>
      <Nav
        title="Registrar socio"
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

      <main className="container" style={{ maxWidth: 1080 }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Nuevo socio 🔥</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Se creará dentro de tu mismo gym. Puedes definir el rol, los días de
          membresía iniciales y aceptar el pago en el momento.
        </p>
        <NewUserForm />
      </main>
    </>
  );
}
