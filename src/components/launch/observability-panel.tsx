"use client";

import { useState, useTransition } from "react";
import type { ObservabilitySnapshot } from "@/lib/launch";
import { retryFailedJobsAction } from "@/lib/launch-actions";
import { Button, Stat } from "@/components/ui";
import { LaunchPanel } from "@/components/launch/launch-panel";

export function ObservabilityPanel({ snapshot }: { snapshot: ObservabilitySnapshot }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function retry() {
    start(async () => {
      const res = await retryFailedJobsAction();
      setMessage(res.message);
    });
  }

  return (
    <LaunchPanel
      title="Observability"
      description="Sync health, failed jobs, and operational warnings. Failed jobs auto-retry with backoff; permanently failed jobs can be requeued here."
      actions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || snapshot.jobs.failed === 0}
          onClick={retry}
        >
          {pending ? "Requeuing…" : "Retry failed jobs"}
        </Button>
      }
    >
      {message ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending" value={snapshot.jobs.pending} />
        <Stat label="Running" value={snapshot.jobs.running} />
        <Stat label="Failed" value={snapshot.jobs.failed} />
        <Stat label="Retryable" value={snapshot.jobs.retryable} />
      </div>

      {snapshot.warnings.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Operational warnings</h3>
          <ul className="space-y-2">
            {snapshot.warnings.map((w) => (
              <li
                key={w}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--muted)]">
          No operational warnings.
        </p>
      )}

      {snapshot.jobs.recentFailed.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Recent failed jobs</h3>
          <ul className="space-y-2">
            {snapshot.jobs.recentFailed.map((j) => (
              <li
                key={j.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--ink)]">{j.type}</p>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                    attempt {j.attempts}
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-800">{j.error ?? "Unknown error"}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.recentErrors.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Recent sync failures</h3>
          <ul className="space-y-2">
            {snapshot.recentErrors.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-4 py-3"
              >
                <p className="text-sm font-medium text-[var(--ink)]">
                  {e.integration.name} ({e.integration.provider})
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{e.summary}</p>
                {e.error ? <p className="mt-1 text-xs text-rose-800">{e.error}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        Max job attempts {snapshot.maxJobAttempts} · {snapshot.jobs.completedRecent} completed in
        last 24h
      </p>
    </LaunchPanel>
  );
}
