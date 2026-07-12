"use client";

import { useState, useTransition } from "react";
import type { SmokeTestResult } from "@/lib/launch";
import { runSmokeTestsAction } from "@/lib/launch-actions";
import { Button } from "@/components/ui";

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

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Smoke tests
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Core flow checks — company, properties, SOP/SOW, turnovers, integrations, jobs.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={rerun}>
          {pending ? "Running…" : "Re-run suite"}
        </Button>
      </div>
      {message ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)]">
          {message}
        </p>
      ) : null}
      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">
          No smoke results yet. Run the suite to verify core flows.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border px-4 py-3 ${
                r.ok
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                  : "border-rose-200 bg-rose-50/80 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{r.name}</p>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                  {r.ok ? "Pass" : "Fail"}
                  {r.ms ? ` · ${r.ms}ms` : ""}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-90">{r.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
