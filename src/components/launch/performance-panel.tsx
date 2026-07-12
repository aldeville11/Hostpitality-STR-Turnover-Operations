import type { PerformanceSnapshot } from "@/lib/launch";
import { Stat } from "@/components/ui";
import { LaunchPanel } from "@/components/launch/launch-panel";

export function PerformancePanel({ snapshot }: { snapshot: PerformanceSnapshot }) {
  const rows = [
    { label: "Properties", value: snapshot.volumes.properties },
    { label: "Turnovers", value: snapshot.volumes.turnovers },
    { label: "Issues", value: snapshot.volumes.issues },
    { label: "QA inspections", value: snapshot.volumes.inspections },
    { label: "Users", value: snapshot.volumes.users },
    { label: "Pending jobs", value: snapshot.jobs.pending },
    { label: "Failed jobs", value: snapshot.jobs.failed },
    { label: "Failed syncs (7d)", value: snapshot.failedSyncs7d },
  ];

  return (
    <LaunchPanel
      title="Performance snapshot"
      description="Volume and query-budget signals for list pressure. Prefer filters and scoped queries as counts grow."
    >
      <p className="text-sm text-[var(--ink)]">
        Diagnostics query budget:{" "}
        <span className="font-semibold">{snapshot.listQueryMs}ms</span>
      </p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <Stat key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
      <ul className="space-y-1.5 text-xs text-[var(--muted)]">
        {snapshot.recommendations.map((rec) => (
          <li key={rec}>· {rec}</li>
        ))}
      </ul>
    </LaunchPanel>
  );
}
