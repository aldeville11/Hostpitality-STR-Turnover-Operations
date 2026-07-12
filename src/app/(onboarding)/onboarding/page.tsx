import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import {
  getOnboardingContext,
  getResumeHref,
  ONBOARDING_STEPS,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { Button, ModuleCard, StatusBadge } from "@/components/ui";

function hubStatus(status: OnboardingProgress[OnboardingStepId], required: boolean) {
  if (status === "complete") {
    return <StatusBadge status="complete">Done</StatusBadge>;
  }
  if (status === "skipped") {
    return <StatusBadge status="pending">Skipped</StatusBadge>;
  }
  if (required) {
    return <StatusBadge status="needs_review">Required</StatusBadge>;
  }
  return <StatusBadge status="pending">Optional</StatusBadge>;
}

export default async function OnboardingHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOnboarded(user)) redirect("/dashboard");
  if (!user.companyId) redirect("/signup");

  const ctx = await getOnboardingContext(user.companyId);
  const resumeHref = getResumeHref(ctx.progress, ctx.company.onboardingStep);

  const completedCount = ONBOARDING_STEPS.filter((step) => {
    const status = ctx.progress[step.id as OnboardingStepId];
    return status === "complete" || status === "skipped";
  }).length;

  return (
    <ModuleCard
      title="Workspace setup"
      description="Complete these steps to prepare Hostpitality for turnover operations. Progress saves automatically — leave and resume anytime."
      actions={
        <StatusBadge status={completedCount === ONBOARDING_STEPS.length ? "complete" : "running"}>
          {completedCount}/{ONBOARDING_STEPS.length} steps
        </StatusBadge>
      }
    >
      <ul className="space-y-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = ctx.progress[step.id as OnboardingStepId];
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {index + 1}. {step.label}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{step.description}</p>
                </div>
                {hubStatus(status, step.required)}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={resumeHref}>
          <Button>Continue setup</Button>
        </Link>
        <Link href="/onboarding/review">
          <Button variant="outline">Jump to review</Button>
        </Link>
      </div>
    </ModuleCard>
  );
}
