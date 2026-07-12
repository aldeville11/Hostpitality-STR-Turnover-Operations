import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getOnboardingContext,
  validateActivation,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { StepCard } from "@/components/onboarding/step-card";
import { Button, StatusBadge } from "@/components/ui";
import { continueReviewAction } from "@/lib/onboarding-actions";

export default async function OnboardingReviewPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  const errors = validateActivation({
    properties: ctx.counts.properties,
    sops: ctx.counts.sops,
    sows: ctx.counts.sows,
    vendors: ctx.counts.vendors,
    progress: {
      ...ctx.progress,
      company: ctx.progress.company ?? "complete",
    },
  });

  const rows: { label: string; href: string; value: string; ok: boolean; step: OnboardingStepId }[] = [
    {
      label: "Company",
      href: "/onboarding/company",
      value: ctx.company.name,
      ok: ctx.progress.company === "complete",
      step: "company",
    },
    {
      label: "Properties",
      href: "/onboarding/properties",
      value: `${ctx.counts.properties} added`,
      ok: ctx.counts.properties > 0,
      step: "properties",
    },
    {
      label: "Calendars",
      href: "/onboarding/calendars",
      value:
        ctx.progress.calendars === "skipped"
          ? "Skipped"
          : `${ctx.counts.calendars} configured`,
      ok: true,
      step: "calendars",
    },
    {
      label: "SOPs",
      href: "/onboarding/sops",
      value: `${ctx.counts.sops} uploaded`,
      ok: ctx.counts.sops > 0,
      step: "sops",
    },
    {
      label: "SOW templates",
      href: "/onboarding/sows",
      value: `${ctx.counts.sows} created`,
      ok: ctx.counts.sows > 0,
      step: "sows",
    },
    {
      label: "Vendors",
      href: "/onboarding/vendors",
      value: `${ctx.counts.vendors} added`,
      ok: ctx.counts.vendors > 0,
      step: "vendors",
    },
  ];

  return (
    <StepCard
      title="Review setup"
      description="Confirm required pieces are in place before activating the first turnover workflow."
      actions={
        errors.length === 0 ? (
          <form action={continueReviewAction}>
            <Button type="submit">Continue to activation</Button>
          </form>
        ) : (
          <Button type="button" disabled>
            Fix required items to continue
          </Button>
        )
      }
    >
      <div className="space-y-2">
        {rows.map((row) => (
          <Link
            key={row.step}
            href={row.href}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{row.label}</p>
              <p className="text-xs text-[var(--text-secondary)]">{row.value}</p>
            </div>
            <StatusBadge status={row.ok ? "complete" : "needs_review"}>
              {row.ok ? "Ready" : "Needed"}
            </StatusBadge>
          </Link>
        ))}
      </div>

      {errors.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200/80 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
          <p className="font-semibold">Still needed</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-[var(--success)]">
          Setup looks complete. Next you will activate the workspace and create the first turnover.
          After activation, confirm operational go-live in Launch Readiness (`/launch`) under
          Administration.
        </p>
      )}
    </StepCard>
  );
}
