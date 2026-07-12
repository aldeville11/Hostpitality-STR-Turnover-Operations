import Link from "next/link";
import { Badge } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { ReportingDashboard } from "@/lib/reports";
import { statusLabel } from "@/lib/utils";

export function ReportDashboard({ data }: { data: ReportingDashboard }) {
  const { summary, volumeTrend, byProperty, statusBreakdown } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Turnover volume"
          value={summary.turnoverVolume}
          hint={`${summary.completedCount} completed`}
          tone="accent"
        />
        <MetricCard
          label="On-time completion"
          value={summary.completedCount ? `${summary.onTimeRate}%` : "—"}
          hint={`${summary.onTimeCount} of ${summary.completedCount}`}
          tone={summary.onTimeRate >= 80 ? "success" : summary.onTimeRate >= 50 ? "warning" : "danger"}
        />
        <MetricCard
          label="QA pass rate"
          value={summary.qaDecidedCount ? `${summary.qaPassRate}%` : "—"}
          hint={`${summary.qaApprovedCount} of ${summary.qaDecidedCount} decided`}
          tone={summary.qaPassRate >= 80 ? "success" : "warning"}
        />
        <MetricCard
          label="Issues"
          value={summary.issueCount}
          hint={`${summary.openIssueCount} open · ${summary.resolvedIssueCount} resolved`}
          tone={summary.openIssueCount ? "warning" : "success"}
        />
        <MetricCard
          label="Cleaner utilization"
          value={`${summary.cleanerUtilization}%`}
          hint={`${summary.assignedSlots} assigned · ${summary.cleanerCount} cleaners`}
        />
      </div>

      <TrendChart
        title="Turnover volume by day"
        description="Scheduled turnovers in range, with completed overlay."
        points={volumeTrend}
        primaryLabel="Scheduled"
        secondaryLabel="Completed"
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              By property
            </h2>
            <Link href="/reports/property" className="text-sm text-[var(--accent)] hover:underline">
              Full property report
            </Link>
          </div>
          {byProperty.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No turnovers in this range.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 pr-3 font-semibold">Property</th>
                    <th className="py-2 pr-3 font-semibold">Volume</th>
                    <th className="py-2 pr-3 font-semibold">On-time</th>
                    <th className="py-2 font-semibold">Issue rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byProperty.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)]/70">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/properties/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-[var(--muted)]">{p.unitCode}</p>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{p.turnovers}</td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {p.completed ? `${p.onTimeRate}%` : "—"}
                      </td>
                      <td className="py-2.5 tabular-nums">{p.issueRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Status mix
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Turnovers in the selected range.</p>
          <ul className="mt-4 space-y-2">
            {statusBreakdown.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">No data</li>
            ) : (
              statusBreakdown.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <Badge tone="neutral">{statusLabel(row.status)}</Badge>
                  <span className="tabular-nums font-medium">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
