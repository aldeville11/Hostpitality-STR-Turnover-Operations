import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ExportPanel } from "@/components/reports/export-panel";
import { ReportFiltersBar } from "@/components/reports/report-filters";
import { PropertyReportView } from "@/components/reports/property-report";
import { QaReport } from "@/components/reports/qa-report";
import { CleanerReportView } from "@/components/reports/cleaner-report";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import {
  REPORT_VIEW_LABELS,
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
  if (view === "property") {
    const data = await getPropertyReport(user.companyId, filters);
    body = <PropertyReportView data={data} />;
  } else if (view === "qa") {
    const data = await getQaIssueReport(user.companyId, filters);
    body = <QaReport data={data} />;
  } else if (view === "cleaners") {
    const data = await getCleanerReport(user.companyId, filters);
    body = <CleanerReportView data={data} />;
  } else {
    const data = await getReportingDashboard(user.companyId, filters);
    body = <ReportDashboard data={data} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={REPORT_VIEW_LABELS[view]}
        description="Filterable operational report with CSV export."
      />

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
