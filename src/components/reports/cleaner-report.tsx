import Link from "next/link";
import { Badge, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { CleanerReport } from "@/lib/reports";

function reworkStatus(rate: number) {
  if (rate > 20) return "warning" as const;
  if (rate > 10) return "at_risk" as const;
  return "healthy" as const;
}

export function CleanerReportView({ data }: { data: CleanerReport }) {
  const { summary, cleaners, workloadTrend } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cleaners" value={summary.cleaners} tone="accent" />
        <MetricCard
          label="Avg completion rate"
          value={`${summary.avgCompletionRate}%`}
          hint={`${summary.totalAssignments} assignments`}
          tone="success"
        />
        <MetricCard
          label="Avg rework rate"
          value={`${summary.avgReworkRate}%`}
          tone={summary.avgReworkRate > 15 ? "warning" : "default"}
        />
        <MetricCard
          label="Avg SLA adherence"
          value={`${summary.avgSlaAdherence}%`}
          hint="On-time among completed"
        />
      </div>

      <TrendChart
        title="Assigned workload by day"
        description="Turnovers assigned to cleaners across the range."
        points={workloadTrend}
        primaryLabel="Assignments"
      />

      <ModuleCard
        title="Cleaner performance"
        description="Workload, completion, rework, and SLA adherence for the filtered range."
      >
        {cleaners.length === 0 ? (
          <EmptyState
            title="No cleaners match filters"
            description="Adjust the cleaner or property filter to review workforce performance."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-semibold">Cleaner</th>
                  <th className="py-2 pr-3 font-semibold">Workload</th>
                  <th className="py-2 pr-3 font-semibold">Completion</th>
                  <th className="py-2 pr-3 font-semibold">Rework</th>
                  <th className="py-2 pr-3 font-semibold">SLA</th>
                  <th className="py-2 font-semibold">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {cleaners.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)]/70">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/cleaners/${c.id}`}
                        className="font-medium text-[var(--accent-strong)] hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">
                        {c.type} · cap {c.capacity}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="tabular-nums font-medium">{c.workload}</span>
                      <span className="ml-1 text-xs text-[var(--muted)]">
                        ({c.activeWorkload} active)
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {c.workload ? `${c.completionRate}%` : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      {c.workload ? (
                        <StatusBadge status={reworkStatus(c.reworkRate)}>
                          {c.reworkRate}%
                        </StatusBadge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {c.completed ? `${c.slaAdherence}%` : "—"}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={c.utilization >= 90 ? "warning" : "neutral"}>
                        {c.utilization}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleCard>
    </div>
  );
}
