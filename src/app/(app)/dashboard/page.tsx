import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaysTurnovers } from "@/components/dashboard/todays-turnovers";
import { OverdueJobs } from "@/components/dashboard/overdue-jobs";
import { CleanerAssignments } from "@/components/dashboard/cleaner-assignments";
import { OpenIssues } from "@/components/dashboard/open-issues";
import { PhotoStatus } from "@/components/dashboard/photo-status";
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts";
import { CompletionSummary } from "@/components/dashboard/completion-summary";

export default async function DashboardPage() {
  const user = await requireUser({ permission: "dashboard:view" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getDashboardData(user.companyId);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Operational command center for ${user.company?.name ?? "your company"} — today’s turnovers, risk, and field status.`}
      />

      <SummaryCards summary={data.summary} />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <TodaysTurnovers turnovers={data.todaysTurnovers} />
        <OverdueJobs jobs={data.overdue} />
        <CleanerAssignments assignments={data.assignments} />
        <OpenIssues issues={data.openIssues} />
        <PhotoStatus photoStats={data.photoStats} todaysPhotoGaps={data.todaysPhotoGaps} />
        <InventoryAlerts alerts={data.inventoryAlerts} />
        <div className="xl:col-span-2">
          <CompletionSummary
            completion={data.completion}
            ownerNotifications={data.ownerNotifications}
          />
        </div>
      </div>
    </div>
  );
}
