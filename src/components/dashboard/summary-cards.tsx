import Link from "next/link";
import { ModuleCard, Stat, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

export function SummaryCards({ summary }: { summary: DashboardData["summary"] }) {
  return (
    <ModuleCard
      title="Operations snapshot"
      description="Live portfolio metrics from current turnovers, issues, inventory, and field coverage."
      actions={
        <Link
          href="/launch"
          className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
        >
          Launch readiness →
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Today’s turnovers" value={summary.todaysCount} hint="Windows scheduled today" />
        <Stat
          label="Turnovers at risk"
          value={summary.overdueCount}
          hint={summary.overdueCount ? "Overdue or past deadline" : "None late"}
          emphasis={summary.overdueCount > 0}
        />
        <Stat label="Open issues" value={summary.openIssuesCount} hint="Active operational issues" />
        <Stat
          label="Assignment coverage"
          value={summary.activeCleaners}
          hint="Cleaners with open jobs"
        />
        <Stat
          label="Photo gaps today"
          value={summary.photoGapsToday}
          hint="Missing required evidence"
        />
        <Stat
          label="Inventory shortages"
          value={summary.inventoryAlertsCount}
          hint="At or below reorder"
        />
        <Stat label="Completion rate (30d)" value={`${summary.completionRate}%`} />
        <Stat
          label="Owner notifications (30d)"
          value={summary.ownerNotificationsSent}
          hint="Sent in last 30 days"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={summary.overdueCount ? "at_risk" : "healthy"}>
          {summary.overdueCount ? "SLA pressure" : "SLA healthy"}
        </StatusBadge>
        <StatusBadge status={summary.inventoryAlertsCount ? "warning" : "healthy"}>
          {summary.inventoryAlertsCount ? "Stock attention" : "Stock healthy"}
        </StatusBadge>
      </div>
    </ModuleCard>
  );
}
