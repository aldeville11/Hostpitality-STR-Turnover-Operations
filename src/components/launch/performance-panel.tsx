import type { PerformanceSnapshot } from "@/lib/launch";
import { ModuleCard, Stat } from "@/components/ui";

export function PerformancePanel({ snapshot }: { snapshot: PerformanceSnapshot }) {
  return (
    <ModuleCard
      title="Performance snapshot"
      description="Portfolio volume and diagnostics query budget for list and job pressure."
    >
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Diagnostics query budget:{" "}
        <span className="font-semibold text-[var(--text-primary)]">{snapshot.listQueryMs}ms</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Properties" value={snapshot.volumes.properties} />
        <Stat label="Turnovers" value={snapshot.volumes.turnovers} />
        <Stat label="Issues" value={snapshot.volumes.issues} />
        <Stat label="QA inspections" value={snapshot.volumes.inspections} />
        <Stat label="Users" value={snapshot.volumes.users} />
        <Stat label="Pending jobs" value={snapshot.jobs.pending} />
        <Stat label="Failed jobs" value={snapshot.jobs.failed} />
        <Stat label="Failed syncs (7d)" value={snapshot.failedSyncs7d} />
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-[var(--muted)]">
        {snapshot.recommendations.map((rec) => (
          <li key={rec}>· {rec}</li>
        ))}
      </ul>
    </ModuleCard>
  );
}
