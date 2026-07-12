import Link from "next/link";
import { Badge } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { CleanerReport } from "@/lib/reports";

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

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Cleaner performance
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Workload, completion, rework, and SLA adherence for the filtered range.
        </p>

        {cleaners.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No cleaners match filters.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
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
                        className="font-medium hover:underline"
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
                        <Badge tone={c.reworkRate > 20 ? "warning" : "neutral"}>
                          {c.reworkRate}%
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {c.completed ? `${c.slaAdherence}%` : "—"}
                    </td>
                    <td className="py-2.5 tabular-nums">{c.utilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
