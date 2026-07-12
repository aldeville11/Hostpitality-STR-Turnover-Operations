import Link from "next/link";
import { Badge } from "@/components/ui";
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
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--muted)]">
            No property activity in this range.
          </div>
        ) : (
          data.properties.map((p) => (
            <section
              key={p.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/properties/${p.id}`}
                    className="font-[family-name:var(--font-display)] text-lg font-semibold hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {p.unitCode} · {p.city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.atRisk ? <Badge tone="danger">{p.atRisk} at risk</Badge> : null}
                  {p.openIssues ? <Badge tone="warning">{p.openIssues} open issues</Badge> : null}
                  {p.lowStockItems ? (
                    <Badge tone="neutral">{p.lowStockItems} low stock</Badge>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <Stat label="Turnovers" value={String(p.turnovers)} />
                <Stat
                  label="On-time"
                  value={p.completed ? `${p.onTimeRate}%` : "—"}
                />
                <Stat label="Issue rate" value={`${p.issueRate}%`} />
                <Stat
                  label="QA fail rate"
                  value={p.qaFailRate || p.turnovers ? `${p.qaFailRate}%` : "—"}
                />
                <Stat label="Restock signals" value={String(p.restockFrequency)} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
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
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  );
}
