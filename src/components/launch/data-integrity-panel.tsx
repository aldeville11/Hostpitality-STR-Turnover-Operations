"use client";

import { useState, useTransition } from "react";
import type { LaunchCheck } from "@/lib/launch";
import { repairIntegrityAction } from "@/lib/launch-actions";
import { Badge, Button } from "@/components/ui";
import { LaunchPanel } from "@/components/launch/launch-panel";

const SEV: Record<LaunchCheck["severity"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-950",
  fail: "border-rose-200 bg-rose-50 text-rose-950",
};

const SEV_TONE: Record<LaunchCheck["severity"], "success" | "warning" | "danger"> = {
  ok: "success",
  warn: "warning",
  fail: "danger",
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
    <LaunchPanel
      title="Data integrity"
      description="Relationship and schema checks across properties, bookings, turnovers, SOPs, SOWs, QA, and issues. Repair applies migration-safe defaults and backfills."
      actions={
        <Button type="button" size="sm" disabled={pending} onClick={repair}>
          {pending ? "Repairing…" : "Repair & backfill"}
        </Button>
      }
    >
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
              <Badge tone={SEV_TONE[c.severity]}>
                {c.severity}
                {typeof c.count === "number" ? ` · ${c.count}` : ""}
                {c.repairable ? " · repairable" : ""}
              </Badge>
            </div>
            <p className="mt-1 text-xs opacity-90">{c.detail}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] opacity-70">{c.area}</p>
          </li>
        ))}
      </ul>
    </LaunchPanel>
  );
}
