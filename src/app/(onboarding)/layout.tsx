import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import { getOnboardingContext, getResumeHref } from "@/lib/onboarding";
import { OnboardingStepperClient } from "@/components/onboarding/stepper-client";
import { logoutAction } from "@/lib/actions";
import { BrandMark } from "@/components/brand";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOnboarded(user)) redirect("/dashboard");
  if (!user.companyId) redirect("/signup");

  const ctx = await getOnboardingContext(user.companyId);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,color-mix(in_srgb,var(--accent)_18%,transparent)_0%,transparent_42%),radial-gradient(circle_at_90%_8%,color-mix(in_srgb,var(--info)_14%,transparent)_0%,transparent_36%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/onboarding" className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-[var(--text-primary)]">
                Hostpitality
              </p>
              <p className="text-xs text-[var(--muted)]">{ctx.company.name} · Setup</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={getResumeHref(ctx.progress, ctx.company.onboardingStep)}
              className="text-sm font-medium text-[var(--accent-strong)] hover:underline"
            >
              Resume
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <OnboardingStepperClient progress={ctx.progress} />
        {children}
      </div>
    </div>
  );
}
