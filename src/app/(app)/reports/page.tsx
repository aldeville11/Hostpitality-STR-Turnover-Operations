import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import { ExportPanel } from "@/components/reports/export-panel";
import { ReportFiltersBar } from "@/components/reports/report-filters";
import {
  getReportDataset,
  getReportFilterOptions,
  getReportingDashboard,
  parseReportFilters,
} from "@/lib/reports";
import { statusLabel } from "@/lib/utils";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser({ permission: "owners:report" });
  if (!user.companyId) redirect("/onboarding");

  const sp = await searchParams;
  const filters = parseReportFilters(sp);
  const [options, data, dataset] = await Promise.all([
    getReportFilterOptions(user.companyId),
    getReportingDashboard(user.companyId, filters),
    getReportDataset(user.companyId, "overview", filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting"
        description="Company-wide operational visibility across turnovers, QA, issues, and cleaners."
      />

      <ReportFiltersBar
        view="overview"
        filters={filters}
        properties={options.properties}
        cleaners={options.cleaners}
        statuses={[
          "SCHEDULED",
          "ASSIGNED",
          "IN_PROGRESS",
          "READY_FOR_QA",
          "NEEDS_REWORK",
          "COMPLETED",
          "BLOCKED",
          "OVERDUE",
        ].map((s) => ({ value: s, label: statusLabel(s) }))}
      />

      <ExportPanel view="overview" filename={dataset.filename} csv={dataset.csv} />
      <ReportDashboard data={data} />
    </div>
  );
}
