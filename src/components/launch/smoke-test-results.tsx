"use client";

import { useState, useTransition } from "react";
import type { SmokeTestResult } from "@/lib/launch";
import { runSmokeTestsAction } from "@/lib/launch-actions";
import { Button, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";

export function SmokeTestResults({ initial }: { initial: SmokeTestResult[] }) {
  const [results, setResults] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function rerun() {
    start(async () => {
      const res = await runSmokeTestsAction();
      setMessage(res.message);
      if (res.details) {
        setResults(
          res.details.map((line, i) => {
            const ok = line.startsWith("PASS");
            const rest = line.replace(/^(PASS|FAIL) · /, "");
            const colon = rest.indexOf(": ");
            const name = colon >= 0 ? rest.slice(0, colon) : rest;
            const detail = colon >= 0 ? rest.slice(colon + 2) : rest;
            return {
              id: `live-${i}`,
              name,
              ok,
              detail,
              ms: 0,
            };
          })
        );
      }
    });
  }

  const failed = results.filter((r) => !r.ok).length;

  return (
    <ModuleCard
      title="Smoke tests"
      description="Core flow verification for company, properties, templates, turnovers, integrations, and jobs."
      actions={
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={rerun}>
          {pending ? "Running…" : "Re-run suite"}
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={failed ? "failed" : "passed"}>
          {failed ? `${failed} failed` : "All passed"}
        </StatusBadge>
        <span className="text-xs text-[var(--muted)]">{results.length} checks</span>
      </div>
      {message ? (
        <p className="mb-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      {results.length === 0 ? (
        <EmptyState
          title="No smoke results yet"
          description="Run the suite to verify core operational flows before production enablement."
          action={
            <Button type="button" size="sm" disabled={pending} onClick={rerun}>
              Run suite
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{r.detail}</p>
              </div>
              <StatusBadge status={r.ok ? "passed" : "failed"}>
                {r.ok ? "Passed" : "Failed"}
                {r.ms ? ` · ${r.ms}ms` : ""}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
