import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import {
  getOnboardingContext,
  getResumeHref,
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { Badge, Button } from "@/components/ui";

export default async function OnboardingHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOnboarded(user)) redirect("/dashboard");
  if (!user.companyId) redirect("/signup");

  const ctx = await getOnboardingContext(user.companyId);
  const resumeHref = getResumeHref(ctx.progress, ctx.company.onboardingStep);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-6 backdrop-blur">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        Workspace setup
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Complete these steps to prepare Hostpitality for turnover operations. Progress saves
        automatically — leave and resume anytime.
      </p>

      <div className="mt-6 space-y-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = ctx.progress[step.id as OnboardingStepId];
          return (
            <Link
              key={step.id}
              href={step.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-4 py-3 hover:bg-[var(--surface-2)]/50"
            >
              <div>
                <p className="font-medium">
                  {index + 1}. {step.label}
                </p>
                <p className="text-xs text-[var(--muted)]">{step.description}</p>
              </div>
              <Badge
                tone={
                  status === "complete" ? "success" : status === "skipped" ? "neutral" : "warning"
                }
              >
                {status === "complete"
                  ? "Done"
                  : status === "skipped"
                    ? "Skipped"
                    : step.required
                      ? "Required"
                      : "Optional"}
              </Badge>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={resumeHref}>
          <Button>Continue setup</Button>
        </Link>
        <Link href="/onboarding/review">
          <Button variant="outline">Jump to review</Button>
        </Link>
      </div>
    </div>
  );
}
