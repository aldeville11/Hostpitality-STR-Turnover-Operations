"use client";

import { useState, useTransition } from "react";
import type { ObservabilitySnapshot } from "@/lib/launch";
import { retryFailedJobsAction } from "@/lib/launch-actions";
import { Button, EmptyState, ModuleCard, Stat, StatusBadge } from "@/components/ui";

export function ObservabilityPanel({ snapshot }: { snapshot: ObservabilitySnapshot }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function retry() {
    start(async () => {
      const res = await retryFailedJobsAction();
      setMessage(res.message);
    });
  }

  const queueHealthy = snapshot.jobs.failed === 0;

  return (
    <ModuleCard
      title="Observability"
      description="Job queue health, sync failures, and operational warnings."
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={queueHealthy ? "healthy" : "failed"}>
          Queue {queueHealthy ? "healthy" : "degraded"}
        </StatusBadge>
        <span className="text-xs text-[var(--muted)]">
          Max attempts {snapshot.maxJobAttempts} · {snapshot.jobs.completedRecent} completed (24h)
        </span>
      </div>

      {message ? (
        <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending" value={snapshot.jobs.pending} />
        <Stat label="Running" value={snapshot.jobs.running} />
        <Stat label="Failed" value={snapshot.jobs.failed} />
        <Stat label="Retryable" value={snapshot.jobs.retryable} />
      </div>

      {snapshot.warnings.length > 0 ? (
        <div className="mb-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Operational warnings</h3>
          <ul className="space-y-2">
            {snapshot.warnings.map((w) => (
              <li
                key={w}
                className="rounded-[var(--radius-md)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]"
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-5">
          <EmptyState
            title="No operational warnings"
            description="Job and sync monitors report a clean attention queue for this company."
          />
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Failed jobs</h3>
      {snapshot.jobs.recentFailed.length === 0 ? (
        <EmptyState
          title="No failed jobs"
          description="All background jobs completed successfully during the last processing window."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--surface-raised)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 font-semibold">Job type</th>
                <th className="px-3 py-2 font-semibold">Failure reason</th>
                <th className="px-3 py-2 font-semibold">Retries</th>
                <th className="px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.jobs.recentFailed.map((j) => (
                <tr key={j.id} className="border-b border-[var(--border)]/80 hover:bg-[var(--surface-raised)]">
                  <td className="px-3 py-2.5 font-medium">{j.type}</td>
                  <td className="max-w-[280px] px-3 py-2.5 text-[var(--danger)]">
                    <span className="line-clamp-2">{j.error ?? "Unknown error"}</span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{j.attempts}</td>
                  <td className="px-3 py-2.5">
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={retry}>
                      Retry
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {snapshot.recentErrors.length > 0 ? (
        <div className="mt-5 space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent sync failures</h3>
          <ul className="space-y-2">
            {snapshot.recentErrors.map((e) => (
              <li
                key={e.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2"
              >
                <p className="text-sm font-medium">
                  {e.integration.name} ({e.integration.provider})
                </p>
                <p className="text-xs text-[var(--muted)]">{e.summary}</p>
                {e.error ? <p className="mt-1 text-xs text-[var(--danger)]">{e.error}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ModuleCard>
  );
}
