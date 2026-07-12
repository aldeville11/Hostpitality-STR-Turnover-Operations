import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getDashboardData } from "@/lib/dashboard";
import {
  Button,
  EmptyState,
  ModuleCard,
  PageHeader,
  Stat,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

/**
 * Owner CRM / owner list does not exist in this product.
 * This hub surfaces real owner-notification metrics and routes to Reports.
 */
export default async function OwnersPage() {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");

  const canReport = can(user.role, "owners:report");
  const canDashboard = can(user.role, "dashboard:view");

  if (!canReport && !canDashboard) {
    redirect("/dashboard");
  }

  const ownerNotifications = canDashboard
    ? (await getDashboardData(user.companyId)).ownerNotifications
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owners"
        description="Owner-facing reporting and notification activity. There is no separate owner directory — portfolio and performance views live in Reports."
        actions={
          canReport ? (
            <Link href="/reports">
              <Button>Open reports</Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button variant="outline">Open dashboard</Button>
            </Link>
          )
        }
      />

      <ModuleCard
        title="Owner reporting"
        description="Company-wide turnover, QA, and issue visibility used for owner updates."
        actions={
          canReport ? (
            <StatusBadge status="connected">Reports available</StatusBadge>
          ) : (
            <StatusBadge status="needs_review">Reports permission required</StatusBadge>
          )
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Hostpitality does not maintain an Owner CRM. Use Reporting for owner-ready operational
          summaries, and track whether completed turnovers have sent an owner notification.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canReport ? (
            <Link href="/reports">
              <Button variant="outline" size="sm">
                Go to reports
              </Button>
            </Link>
          ) : null}
          {canDashboard ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                View dashboard completion
              </Button>
            </Link>
          ) : null}
        </div>
      </ModuleCard>

      {ownerNotifications ? (
        <ModuleCard
          title="Owner notifications"
          description="Real notification activity from completed turnovers — not a fabricated owner list."
          actions={
            <StatusBadge status="connected">
              {ownerNotifications.sentLast30Days} sent / 30d
            </StatusBadge>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Sent (30 days)" value={ownerNotifications.sentLast30Days} />
            <Stat label="Sent today" value={ownerNotifications.sentToday} />
            <Stat
              label="Missing today"
              value={ownerNotifications.pendingToday}
              hint="Completed jobs still without an owner summary"
              emphasis={ownerNotifications.pendingToday > 0}
            />
          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              Recent owner summaries today
            </p>
            {ownerNotifications.recent.length === 0 ? (
              <EmptyState
                title="No owner summaries today"
                description="Owner notifications appear after a completed turnover is marked notified."
                action={
                  canReport ? (
                    <Link
                      href="/reports"
                      className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
                    >
                      Open reports →
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
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
      ) : null}
    </div>
  );
}
