import { Badge, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { QaIssueReport } from "@/lib/reports";
import { mapIssueSeverity } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

export function QaReport({ data }: { data: QaIssueReport }) {
  const { summary } = data;
  const hasIssues =
    data.bySeverity.length > 0 ||
    data.byCategory.length > 0 ||
    data.recurringIssues.length > 0;

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
        <ModuleCard
          title="Top failure categories"
          description="Failed checklist items and photo proofs."
        >
          {data.topFailureCategories.length === 0 ? (
            <EmptyState
              title="No failures in range"
              description="QA failures will appear here when checklist or photo items fail."
            />
          ) : (
            <ul className="space-y-2">
              {data.topFailureCategories.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{f.label}</span>
                  <Badge tone="warning">{f.count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </ModuleCard>

        <ModuleCard
          title="Recurring issues"
          description="Same title/category appearing more than once."
        >
          {data.recurringIssues.length === 0 ? (
            <EmptyState
              title="No recurring issues"
              description="Repeated titles and categories will surface here when they occur."
            />
          ) : (
            <ul className="space-y-2">
              {data.recurringIssues.map((r) => (
                <li
                  key={`${r.category}-${r.title}`}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
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
        </ModuleCard>
      </div>

      {hasIssues ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {data.bySeverity.length > 0 ? (
            <Breakdown
              title="Issues by severity"
              rows={data.bySeverity.map((r) => ({
                label: r.severity,
                count: r.count,
                status: mapIssueSeverity(r.severity),
              }))}
            />
          ) : null}
          {data.byCategory.length > 0 ? (
            <Breakdown
              title="Issues by category"
              rows={data.byCategory.map((r) => ({
                label: r.category,
                count: r.count,
              }))}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number; status?: ReturnType<typeof mapIssueSeverity> }>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ModuleCard title={title}>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              {r.status ? (
                <StatusBadge status={r.status}>{statusLabel(r.label)}</StatusBadge>
              ) : (
                <span>{r.label}</span>
              )}
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
    </ModuleCard>
  );
}
