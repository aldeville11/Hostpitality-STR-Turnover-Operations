import { redirect } from "next/navigation";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOnboarded(user)) redirect("/dashboard");

  return (
    <div className="relative min-h-screen bg-[var(--bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#99f6e4_0%,transparent_40%),radial-gradient(circle_at_90%_20%,#e0f2fe_0%,transparent_35%)]" />
      <div className="relative mx-auto max-w-xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Finish setup
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Add your first property to activate the Hostpitality workspace. Full SOP, SOW, and cleaner
          setup come in later phases.
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/90 p-6 backdrop-blur">
          <OnboardingForm companyName={user.company?.name ?? "Your company"} />
        </div>
      </div>
    </div>
  );
}
