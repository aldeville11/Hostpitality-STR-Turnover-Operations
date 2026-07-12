"use client";

import { useState, useTransition } from "react";
import type { LaunchCheck } from "@/lib/launch";
import { repairIntegrityAction } from "@/lib/launch-actions";
import { Button } from "@/components/ui";

const SEV: Record<LaunchCheck["severity"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-950",
  fail: "border-rose-200 bg-rose-50 text-rose-950",
};

export function DataIntegrityPanel({ checks }: { checks: LaunchCheck[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [pending, start] = useTransition();

  function repair() {
    start(async () => {
      const res = await repairIntegrityAction();
      setMessage(res.message);
      setDetails(res.details ?? []);
    });
  }

  const fails = checks.filter((c) => c.severity === "fail").length;
  const warns = checks.filter((c) => c.severity === "warn").length;
  const repairable = checks.some((c) => c.repairable && c.severity !== "ok");

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Data integrity
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Relationship and schema checks across properties, bookings, turnovers, SOPs, SOWs, QA,
            and issues. Repair applies migration-safe defaults and backfills.
          </p>
        </div>
        <Button type="button" size="sm" disabled={pending} onClick={repair}>
          {pending ? "Repairing…" : "Repair & backfill"}
        </Button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        {fails} fail · {warns} warn · {checks.length} checks
        {repairable ? " · some items are repairable" : ""}
      </p>
      {message ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm">
          <p className="text-[var(--ink)]">{message}</p>
          {details.length > 0 ? (
            <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto text-xs text-[var(--muted)]">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <ul className="max-h-96 space-y-2 overflow-y-auto">
        {checks.map((c) => (
          <li key={c.id} className={`rounded-xl border px-4 py-3 ${SEV[c.severity]}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{c.title}</p>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                {c.severity}
                {typeof c.count === "number" ? ` · ${c.count}` : ""}
                {c.repairable ? " · repairable" : ""}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-90">{c.detail}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] opacity-70">{c.area}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
