import Link from "next/link";
import { Badge, EmptyState, ModuleCard, Stat } from "@/components/ui";
import { MetricCard } from "@/components/reports/metric-card";
import { TrendChart } from "@/components/reports/trend-chart";
import type { PropertyReport } from "@/lib/reports";

export function PropertyReportView({ data }: { data: PropertyReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Properties" value={data.totals.properties} tone="accent" />
        <MetricCard label="Turnovers" value={data.totals.turnovers} />
        <MetricCard
          label="Avg on-time rate"
          value={data.totals.properties ? `${data.totals.avgOnTimeRate}%` : "—"}
          tone="success"
        />
        <MetricCard label="Issues logged" value={data.totals.issues} tone="warning" />
      </div>

      <TrendChart
        title="Issue openings by day"
        description="New issues linked to the filtered property set."
        points={data.issueTrend}
        primaryLabel="Issues opened"
      />

      <div className="space-y-4">
        {data.properties.length === 0 ? (
          <EmptyState
            title="No property activity in this range"
            description="Adjust filters or wait for turnovers to appear in the reporting period."
          />
        ) : (
          data.properties.map((p) => (
            <ModuleCard
              key={p.id}
              title={p.name}
              description={`${p.unitCode} · ${p.city}`}
              actions={
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/properties/${p.id}`}
                    className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                  >
                    Open property →
                  </Link>
                  {p.atRisk ? <Badge tone="danger">{p.atRisk} at risk</Badge> : null}
                  {p.openIssues ? (
                    <Badge tone="warning">{p.openIssues} open issues</Badge>
                  ) : null}
                  {p.lowStockItems ? (
                    <Badge tone="neutral">{p.lowStockItems} low stock</Badge>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Stat label="Turnovers" value={p.turnovers} />
                <Stat label="On-time" value={p.completed ? `${p.onTimeRate}%` : "—"} />
                <Stat label="Issue rate" value={`${p.issueRate}%`} />
                <Stat
                  label="QA fail rate"
                  value={p.qaFailRate || p.turnovers ? `${p.qaFailRate}%` : "—"}
                />
                <Stat label="Restock signals" value={p.restockFrequency} />
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Common failure points
                </p>
                {p.topFailures.length === 0 ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">No QA failures recorded.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {p.topFailures.map((f) => (
                      <li key={f.label}>
                        <Badge tone="warning">
                          {f.label} · {f.count}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ModuleCard>
          ))
        )}
      </div>
    </div>
  );
}
