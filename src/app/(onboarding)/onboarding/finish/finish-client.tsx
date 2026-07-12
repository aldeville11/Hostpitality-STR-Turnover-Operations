"use client";

import { useState, useTransition } from "react";
import { StepCard } from "@/components/onboarding/step-card";
import { Button, StatusBadge } from "@/components/ui";
import { activateWorkspaceAction } from "@/lib/onboarding-actions";

export function FinishStepClient({
  summary,
  blocked,
}: {
  summary: {
    company: string;
    properties: number;
    sops: number;
    sows: number;
    vendors: number;
  };
  blocked: string[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <StepCard
      title="Activate workspace"
      description="Creates your first scheduled turnover from the setup data and opens the main app."
    >
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-[var(--text-primary)]">{summary.company}</p>
          <StatusBadge status={blocked.length > 0 ? "needs_review" : "complete"}>
            {blocked.length > 0 ? "Blocked" : "Ready to activate"}
          </StatusBadge>
        </div>
        <p className="mt-1 text-[var(--text-secondary)]">
          {summary.properties} properties · {summary.sops} SOPs · {summary.sows} SOWs ·{" "}
          {summary.vendors} vendors
        </p>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
        <li>Mark onboarding complete in the database</li>
        <li>Create a first turnover linked to your first property, SOP, SOW, and vendor</li>
        <li>Queue a reminder job for the turnover window</li>
        <li>
          Enter the main app shell, then confirm go-live in Launch Readiness (`/launch`) under
          Administration
        </li>
      </ul>

      {blocked.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200/80 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
          {blocked.join(" ")}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <form
        action={() => {
          setError(null);
          startTransition(async () => {
            const res = await activateWorkspaceAction();
            if (res?.error) setError(res.error);
          });
        }}
      >
        <Button type="submit" disabled={pending || blocked.length > 0} className="w-full sm:w-auto">
          {pending ? "Activating…" : "Activate first turnover workflow"}
        </Button>
      </form>
    </StepCard>
  );
}
