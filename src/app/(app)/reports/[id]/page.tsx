import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ExportPanel } from "@/components/reports/export-panel";
import { ReportFiltersBar } from "@/components/reports/report-filters";
import { ReportCatalog } from "@/components/reports/report-catalog";
import { PropertyReportView } from "@/components/reports/property-report";
import { QaReport } from "@/components/reports/qa-report";
import { CleanerReportView } from "@/components/reports/cleaner-report";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import {
  REPORT_VIEW_DESCRIPTIONS,
  REPORT_VIEW_LABELS,
  formatReportPeriod,
  getCleanerReport,
  getPropertyReport,
  getQaIssueReport,
  getReportDataset,
  getReportFilterOptions,
  getReportingDashboard,
  isReportView,
  parseReportFilters,
  type ReportView,
} from "@/lib/reports";
import { statusLabel } from "@/lib/utils";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (id === "overview") redirect("/reports");
  if (!isReportView(id)) notFound();

  const view = id as ReportView;
  const user = await requireUser({ permission: "owners:report" });
  if (!user.companyId) redirect("/onboarding");

  const sp = await searchParams;
  const filters = parseReportFilters(sp);
  const options = await getReportFilterOptions(user.companyId);
  const dataset = await getReportDataset(user.companyId, view, filters);

  const turnoverStatuses = [
    "SCHEDULED",
    "ASSIGNED",
    "IN_PROGRESS",
    "READY_FOR_QA",
    "NEEDS_REWORK",
    "COMPLETED",
    "BLOCKED",
    "OVERDUE",
  ].map((s) => ({ value: s, label: statusLabel(s) }));

  const qaStatuses = [
    ...turnoverStatuses,
    ...["OPEN", "TRIAGED", "ESCALATED", "RESOLVED", "CLOSED"].map((s) => ({
      value: s,
      label: statusLabel(s),
    })),
  ];

  let body: ReactNode = null;
  let range: { from: Date | string; to: Date | string } = {
    from: filters.from ?? "",
    to: filters.to ?? "",
  };

  if (view === "property") {
    const data = await getPropertyReport(user.companyId, filters);
    range = data.range;
    body = <PropertyReportView data={data} />;
  } else if (view === "qa") {
    const data = await getQaIssueReport(user.companyId, filters);
    range = data.range;
    body = <QaReport data={data} />;
  } else if (view === "cleaners") {
    const data = await getCleanerReport(user.companyId, filters);
    range = data.range;
    body = <CleanerReportView data={data} />;
  } else {
    const data = await getReportingDashboard(user.companyId, filters);
    range = data.range;
    body = <ReportDashboard data={data} />;
  }

  const period = formatReportPeriod(range.from, range.to);

  return (
    <div className="space-y-6">
      <PageHeader
        title={REPORT_VIEW_LABELS[view]}
        description={REPORT_VIEW_DESCRIPTIONS[view]}
        meta={
          <>
            <span>Reporting period · {period}</span>
            <span>CSV export available</span>
          </>
        }
      />

      <ReportCatalog activeView={view} filters={filters} range={range} />

      <ReportFiltersBar
        view={view}
        filters={filters}
        properties={options.properties}
        cleaners={options.cleaners}
        statuses={view === "qa" ? qaStatuses : turnoverStatuses}
      />

      <ExportPanel view={view} filename={dataset.filename} csv={dataset.csv} />
      {body}
    </div>
  );
}
