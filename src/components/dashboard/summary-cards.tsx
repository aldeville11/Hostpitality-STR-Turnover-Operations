import { Stat } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

export function SummaryCards({ summary }: { summary: DashboardData["summary"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Today’s turnovers" value={summary.todaysCount} hint="Scheduled windows today" />
      <Stat
        label="Overdue jobs"
        value={summary.overdueCount}
        hint={summary.overdueCount ? "Needs attention now" : "None late"}
      />
      <Stat label="Open issues" value={summary.openIssuesCount} hint="Damage, misses, QA" />
      <Stat
        label="Photo gaps today"
        value={summary.photoGapsToday}
        hint="Missing required evidence"
      />
      <Stat label="Inventory alerts" value={summary.inventoryAlertsCount} hint="At or below reorder" />
      <Stat label="Completion rate (30d)" value={`${summary.completionRate}%`} />
      <Stat
        label="Owner notifications"
        value={summary.ownerNotificationsSent}
        hint="Sent in last 30 days"
      />
      <Stat label="Active cleaners" value={summary.activeCleaners} hint="With open assignments" />
    </div>
  );
}
