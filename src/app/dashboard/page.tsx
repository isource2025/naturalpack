import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { authService } from "@/lib/services/authService";
import Nav from "@/components/ui/Nav";
import Badge from "@/components/ui/Badge";
import UserMenu from "./UserMenu";
import AdminHome from "./AdminHome";
import ClientHome from "./ClientHome";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/dashboard");
  }

  // Superadmin no tiene vista "dashboard" propia: su home es /platform.
  if (session.role === "superadmin") {
    redirect("/platform");
  }

  const me = await authService.me(session);
  if (me.role === "client" && !me.trainingProfile) {
    redirect("/onboarding");
  }
  const isAdmin = me.role === "admin";
  const status = me.membership?.status ?? "expired";
  const days = me.membership?.daysRemaining ?? 0;
  const statusClass: "active" | "expired" =
    status === "active" && days > 0 ? "active" : "expired";

  return (
    <>
      <Nav
        title={me.gym.name}
        actions={
          <>
            {isAdmin && (
              <Badge tone="brand" dot>
                Admin
              </Badge>
            )}
            <UserMenu
              name={me.name}
              email={me.email}
              role={me.role as "admin" | "client" | "superadmin"}
            />
          </>
        }
      />

      <main className={isAdmin ? "container" : "container dashboardClient"}>
        {isAdmin ? (
          <AdminHome
            name={me.name}
            gymName={me.gym.name}
            gymSlug={me.gym.slug}
            gymStatus={me.gym.status}
            trialEndsAt={me.gym.trialEndsAt}
          />
        ) : (
          <ClientHome
            name={me.name}
            status={statusClass}
            days={days}
            membership={me.membership}
            trainingProfile={me.trainingProfile}
          />
        )}
      </main>
    </>
  );
}
