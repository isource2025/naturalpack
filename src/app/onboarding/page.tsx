import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { authService } from "@/lib/services/authService";
import OnboardingFlow from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  let session;
  try {
    session = requireSession();
  } catch {
    redirect("/login?next=/onboarding");
  }

  if (session.role === "superadmin") redirect("/platform");

  const me = await authService.me(session);
  if (me.role === "admin") redirect("/dashboard");

  return <OnboardingFlow name={me.name} initialProfile={me.trainingProfile} />;
}
