"use client";

import { useState, useTransition } from "react";
import type { ObservabilitySnapshot } from "@/lib/launch";
import { retryFailedJobsAction } from "@/lib/launch-actions";
import { Button } from "@/components/ui";

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
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Observability
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sync health, failed jobs, and operational warnings. Failed jobs auto-retry with backoff;
            permanently failed jobs can be requeued here.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || snapshot.jobs.failed === 0}
          onClick={retry}
        >
          {pending ? "Requeuing…" : "Retry failed jobs"}
        </Button>
      </div>

      {message ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", value: snapshot.jobs.pending },
          { label: "Running", value: snapshot.jobs.running },
          { label: "Failed", value: snapshot.jobs.failed },
          { label: "Retryable", value: snapshot.jobs.retryable },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-4 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {cell.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {cell.value}
            </p>
          </div>
        ))}
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
                {e.error ? (
                  <p className="mt-1 text-xs text-rose-800">{e.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-[var(--muted)]">
        Max job attempts {snapshot.maxJobAttempts} · {snapshot.jobs.completedRecent} completed in
        last 24h
      </p>
    </section>
  );
}
