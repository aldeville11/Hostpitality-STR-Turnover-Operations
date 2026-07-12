import Link from "next/link";
import { ModuleCard, Stat, StatusBadge } from "@/components/ui";
import { ReadinessMeter } from "@/components/launch/readiness-meter";
import type { presentReadinessSummary } from "@/components/launch/launch-presentation";

export function ExecutiveReadinessSummary({
  summary,
  validatedAtLabel,
  openBlockers,
}: {
  summary: ReturnType<typeof presentReadinessSummary>;
  validatedAtLabel: string;
  openBlockers: string[];
}) {
  return (
    <ModuleCard
      title="Launch readiness"
      description="Executive control summary derived from the current checklist score."
    >
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center gap-2 lg:items-start">
          <ReadinessMeter score={summary.score} ready={summary.ready} />
          <StatusBadge status={summary.ready ? "healthy" : summary.blockers ? "failed" : "warning"}>
            {summary.ready ? "Ship-ready" : summary.blockers ? "Needs attention" : "At risk"}
          </StatusBadge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Critical blockers" value={summary.blockers} hint="Failed launch gates" />
          <Stat label="Warnings" value={summary.warnings} hint="Non-blocking attention" />
          <Stat
            label="Systems passing"
            value={`${summary.passing} of ${summary.total}`}
            hint="Checklist controls"
          />
          <Stat label="Last full validation" value={validatedAtLabel} />
          <Stat
            label="Open controls"
            value={summary.total - summary.passing}
            hint="Remaining before ship-ready"
          />
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Priority blockers
            </p>
            {openBlockers.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">No critical blockers.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {openBlockers.slice(0, 3).map((b) => (
                  <li key={b} className="text-sm text-[var(--danger)]">
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="#launch-gates"
              className="mt-3 inline-block text-xs font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Jump to controls →
            </Link>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
