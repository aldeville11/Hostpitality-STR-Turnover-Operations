"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ModuleCard, StatusBadge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LaunchChecklist as LaunchChecklistData } from "@/lib/launch";
import {
  presentCategories,
  presentLaunchGates,
  type LaunchGate,
  type LaunchGateStatus,
} from "@/components/launch/launch-presentation";

function GateRow({ gate, defaultOpen }: { gate: LaunchGate; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const compact = gate.status === "passed" && !open;

  return (
    <li
      className={cn(
        "rounded-[var(--radius-md)] border transition-colors duration-[var(--transition)]",
        gate.status === "failed" || gate.status === "blocked"
          ? "border-[var(--danger)]/30 bg-[var(--danger-soft)]/40"
          : gate.status === "warning"
            ? "border-[var(--warning)]/30 bg-[var(--warning-soft)]/50"
            : "border-[var(--border)] bg-[var(--surface)]"
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 px-3 py-3 text-left min-h-11"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mt-0.5 text-[var(--muted)]" aria-hidden>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{gate.name}</span>
            <StatusBadge status={gate.status as LaunchGateStatus} />
            {(gate.status === "failed" || gate.status === "blocked") && (
              <StatusBadge status="blocked">{gate.severity}</StatusBadge>
            )}
          </span>
          {!compact ? (
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">{gate.evidence}</span>
          ) : (
            <span className="mt-0.5 block text-xs text-[var(--muted)]">{gate.evidence}</span>
          )}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[var(--border)] px-4 py-3 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Category</dt>
              <dd className="text-[var(--text-primary)]">{gate.category}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Owner</dt>
              <dd className="text-[var(--text-primary)]">{gate.owner}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Severity</dt>
              <dd className="capitalize text-[var(--text-primary)]">{gate.severity}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Dependency</dt>
              <dd className="text-[var(--text-primary)]">{gate.dependency ?? "—"}</dd>
            </div>
          </dl>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">Evidence</p>
            <p className="mt-1 text-[var(--text-secondary)]">{gate.evidence}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {gate.remediation ? (
              <span className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]">
                Action: {gate.remediation}
              </span>
            ) : null}
            {gate.auditHref ? (
              <Link
                href={gate.auditHref}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-xs font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]"
              >
                Audit history
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function LaunchChecklist({
  items,
}: {
  items: LaunchChecklistData["items"];
}) {
  const gates = useMemo(() => presentLaunchGates({ items }), [items]);
  const categories = useMemo(() => presentCategories(gates), [gates]);
  const failing = gates.filter((g) => g.status !== "passed");
  const passing = gates.filter((g) => g.status === "passed");
  const [showPassing, setShowPassing] = useState(false);

  return (
    <div id="launch-gates" className="space-y-4">
      <ModuleCard
        title="Control categories"
        description="Launch gates grouped for enterprise operational review."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{cat.label}</p>
                <StatusBadge status={cat.status} />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {cat.total} checks · {cat.failed} failed · {cat.warnings} warnings
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${cat.completion}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{cat.completion}% complete</p>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard
        title="Operational gates"
        description="Critical and warning controls are expanded. Passing controls stay compact."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPassing((v) => !v)}>
            {showPassing ? "Hide passing" : `Show passing (${passing.length})`}
          </Button>
        }
      >
        <ul className="space-y-2">
          {failing.map((gate) => (
            <GateRow key={gate.id} gate={gate} defaultOpen={gate.expandByDefault} />
          ))}
        </ul>
        {showPassing || failing.length === 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              Passing controls
            </p>
            <ul className="space-y-2">
              {passing.map((gate) => (
                <GateRow key={gate.id} gate={gate} defaultOpen={false} />
              ))}
            </ul>
          </div>
        ) : null}
      </ModuleCard>
    </div>
  );
}
