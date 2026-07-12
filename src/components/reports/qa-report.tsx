import { Badge } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { QaIssueReport } from "@/lib/reports";

export function QaReport({ data }: { data: QaIssueReport }) {
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="QA pass rate"
          value={summary.decided ? `${summary.passRate}%` : "—"}
          hint={`${summary.decided} decided inspections`}
          tone="success"
        />
        <MetricCard
          label="Rework rate"
          value={summary.decided ? `${summary.reworkRate}%` : "—"}
          tone={summary.reworkRate > 20 ? "warning" : "default"}
        />
        <MetricCard
          label="Reinspection rate"
          value={`${summary.reinspectionRate}%`}
          hint={`${summary.reinspectedTurnovers} turnovers re-inspected`}
        />
        <MetricCard
          label="Avg time to resolution"
          value={
            summary.avgResolutionHours != null ? `${summary.avgResolutionHours}h` : "—"
          }
          hint={
            summary.medianResolutionHours != null
              ? `Median ${summary.medianResolutionHours}h · ${summary.issueCount} issues`
              : `${summary.issueCount} issues`
          }
          tone="accent"
        />
      </div>

      <TrendChart
        title="QA inspections by day"
        description="Inspections opened vs approved."
        points={data.qaTrend}
        primaryLabel="Inspections"
        secondaryLabel="Approved"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Top failure categories
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Failed checklist items and photo proofs.
          </p>
          {data.topFailureCategories.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No failures in range.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.topFailureCategories.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{f.label}</span>
                  <Badge tone="warning">{f.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Recurring issues
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Same title/category appearing more than once.
          </p>
          {data.recurringIssues.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No recurring issues detected.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.recurringIssues.map((r) => (
                <li
                  key={`${r.category}-${r.title}`}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{r.title}</p>
                    <Badge tone="danger">{r.count}×</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{r.category}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Breakdown
          title="Issues by severity"
          rows={data.bySeverity.map((r) => ({ label: r.severity, count: r.count }))}
        />
        <Breakdown
          title="Issues by category"
          rows={data.byCategory.map((r) => ({ label: r.category, count: r.count }))}
        />
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">No data</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{r.label}</span>
                <span className="tabular-nums text-[var(--muted)]">{r.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]/80"
                  style={{ width: `${Math.max(6, (r.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
