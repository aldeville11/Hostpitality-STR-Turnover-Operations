import Link from "next/link";
import { Badge, ModuleCard } from "@/components/ui";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_VIEW_CATEGORIES,
  REPORT_VIEW_DESCRIPTIONS,
  REPORT_VIEW_LABELS,
  REPORT_VIEWS,
  formatReportPeriod,
  type ReportFilters,
  type ReportView,
} from "@/lib/reports";

function buildHref(base: string, filters: ReportFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.cleanerId) params.set("cleanerId", filters.cleanerId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function ReportCatalog({
  activeView,
  filters,
  range,
}: {
  activeView: ReportView;
  filters: ReportFilters;
  range: { from: Date | string; to: Date | string };
}) {
  const period = formatReportPeriod(range.from, range.to);

  return (
    <ModuleCard
      title="Report catalog"
      description="Operational reports for the selected period. Open a view or export CSV from the active report."
      actions={<Badge tone="neutral">{period}</Badge>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="py-2 pr-3 font-semibold">Report</th>
              <th className="py-2 pr-3 font-semibold">Category</th>
              <th className="py-2 pr-3 font-semibold">Period</th>
              <th className="py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {REPORT_VIEWS.map((view) => {
              const href =
                view === "overview"
                  ? buildHref("/reports", filters)
                  : buildHref(`/reports/${view}`, filters);
              const active = view === activeView;
              return (
                <tr key={view} className="border-b border-[var(--border)]/70">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-[var(--text-primary)]">
                      {REPORT_VIEW_LABELS[view]}
                      {active ? (
                        <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-strong)]">
                          Active
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 max-w-md text-xs text-[var(--text-secondary)]">
                      {REPORT_VIEW_DESCRIPTIONS[view]}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <Badge tone="neutral">
                      {REPORT_CATEGORY_LABELS[REPORT_VIEW_CATEGORIES[view]]}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap text-[var(--text-secondary)]">
                    {period}
                  </td>
                  <td className="py-3">
                    {active ? (
                      <span className="text-xs text-[var(--muted)]">Viewing · CSV export below</span>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                      >
                        Open report →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ModuleCard>
  );
}
