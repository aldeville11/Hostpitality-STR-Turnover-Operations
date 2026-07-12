import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import { getOnboardingContext, getResumeHref } from "@/lib/onboarding";
import { OnboardingStepperClient } from "@/components/onboarding/stepper-client";
import { logoutAction } from "@/lib/actions";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOnboarded(user)) redirect("/dashboard");
  if (!user.companyId) redirect("/signup");

  const ctx = await getOnboardingContext(user.companyId);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#99f6e4_0%,transparent_40%),radial-gradient(circle_at_90%_10%,#e0f2fe_0%,transparent_35%)]" />
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/onboarding" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">
                Hostpitality
              </p>
              <p className="text-xs text-[var(--muted)]">{ctx.company.name} · Setup</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={getResumeHref(ctx.progress, ctx.company.onboardingStep)}
              className="text-sm font-medium text-[var(--accent)]"
            >
              Resume
            </Link>
            <form action={logoutAction}>
              <button className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">Sign out</button>
            </form>
          </div>
        </div>
        <OnboardingStepperClient progress={ctx.progress} />
        {children}
      </div>
    </div>
  );
}
