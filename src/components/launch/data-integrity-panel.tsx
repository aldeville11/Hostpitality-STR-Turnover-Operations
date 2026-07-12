"use client";

import { useState, useTransition } from "react";
import type { LaunchCheck } from "@/lib/launch";
import { repairIntegrityAction } from "@/lib/launch-actions";
import { Button, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { integrityRows } from "@/components/launch/launch-presentation";

export function DataIntegrityPanel({ checks }: { checks: LaunchCheck[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const rows = integrityRows(checks);
  const fails = rows.filter((r) => r.status === "failed").length;
  const warns = rows.filter((r) => r.status === "warning").length;
  const affected = rows.reduce((n, r) => n + (r.status === "passed" ? 0 : r.records), 0);

  function repair() {
    start(async () => {
      const res = await repairIntegrityAction();
      setMessage(res.message);
      setDetails(res.details ?? []);
    });
  }

  return (
    <ModuleCard
      title="Data integrity"
      description="Diagnostic scan across properties, bookings, turnovers, SOPs, SOWs, QA, and issues."
      actions={
        <>
          <Button type="button" size="sm" disabled={pending} onClick={repair}>
            {pending ? "Repairing…" : "Repair and backfill"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
            Re-run scan
          </Button>
        </>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Scan status</p>
          <div className="mt-1">
            <StatusBadge status={fails ? "failed" : warns ? "warning" : "healthy"} />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Total checks</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
            {checks.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Failures / warnings
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
            {fails} / {warns}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Affected records
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
            {affected}
          </p>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm">
          <p className="text-[var(--text-primary)]">{message}</p>
          {details.length > 0 ? (
            <ul className="mt-2 max-h-32 list-inside list-disc overflow-y-auto text-xs text-[var(--muted)]">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No integrity findings"
          description="Relationship and schema checks across portfolio records completed without issues."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--surface-raised)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 font-semibold">Issue</th>
                <th className="px-3 py-2 font-semibold">Entity</th>
                <th className="px-3 py-2 font-semibold">Severity</th>
                <th className="px-3 py-2 font-semibold">Records</th>
                <th className="px-3 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]/80 hover:bg-[var(--surface-raised)]"
                >
                  <td className="max-w-[220px] px-3 py-2.5">
                    <p className="font-medium text-[var(--text-primary)]">{row.issue}</p>
                    <p className="text-xs text-[var(--muted)] line-clamp-2">{row.evidence}</p>
                  </td>
                  <td className="px-3 py-2.5 capitalize text-[var(--text-secondary)]">{row.entity}</td>
                  <td className="px-3 py-2.5 capitalize">{row.severity}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.records}</td>
                  <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                    {row.repairable ? "Repair and backfill" : "Review"}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModuleCard>
  );
}
