import Link from "next/link";
import { EmptyState, ModuleCard, Stat, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/utils";

export function CompletionSummary({
  completion,
  ownerNotifications,
}: {
  completion: DashboardData["completion"];
  ownerNotifications: DashboardData["ownerNotifications"];
}) {
  return (
    <ModuleCard
      title="Completion & owner updates"
      description="30-day turnover completion and owner notification activity."
      actions={
        <StatusBadge
          status={
            completion.rate >= 80 ? "healthy" : completion.rate >= 50 ? "warning" : "at_risk"
          }
        >
          {completion.rate}% complete
        </StatusBadge>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Completed (30d)" value={completion.completed} />
        <Stat label="Total (30d)" value={completion.total} />
        <Stat label="In progress" value={completion.inProgress} />
        <Stat
          label="Overdue (30d)"
          value={completion.overdue}
          emphasis={completion.overdue > 0}
        />
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
        role="progressbar"
        aria-label="30-day completion rate"
        aria-valuenow={completion.rate}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[var(--success)]"
          style={{ width: `${completion.rate}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Operational completion rate for the last 30 days — not a revenue metric.
      </p>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Owner notifications</p>
          <StatusBadge status="connected">
            {ownerNotifications.sentLast30Days} sent / 30d
          </StatusBadge>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Today: {ownerNotifications.sentToday} sent · {ownerNotifications.pendingToday} completed
          job{ownerNotifications.pendingToday === 1 ? "" : "s"} still missing an owner summary.
        </p>

        {ownerNotifications.recent.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No owner summaries today"
              description="Owner notifications appear here after a completed turnover is marked notified."
              action={
                <Link
                  href="/reports"
                  className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                >
                  Open reports →
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {ownerNotifications.recent.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/turnovers/${n.id}`}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-raised)]"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {n.propertyName} · {n.unitCode}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatDateTime(n.notifiedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModuleCard>
  );
}
