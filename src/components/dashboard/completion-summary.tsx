import { Badge } from "@/components/ui";
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Completion & owner updates
        </h2>
        <Badge tone={completion.rate >= 80 ? "success" : completion.rate >= 50 ? "warning" : "danger"}>
          {completion.rate}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Completed (30d)" value={completion.completed} />
        <Metric label="Total (30d)" value={completion.total} />
        <Metric label="In progress" value={completion.inProgress} />
        <Metric label="Overdue" value={completion.overdue} />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${completion.rate}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Simple operational completion rate for the last 30 days — not a revenue metric.
      </p>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Owner notifications sent</p>
          <Badge tone="info">{ownerNotifications.sentLast30Days} / 30d</Badge>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Today: {ownerNotifications.sentToday} sent · {ownerNotifications.pendingToday} completed
          jobs still missing an owner summary.
        </p>

        {ownerNotifications.recent.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            No owner summaries sent for today’s jobs yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ownerNotifications.recent.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <span>
                  {n.propertyName} · {n.unitCode}
                </span>
                <span className="text-xs text-[var(--muted)]">{formatDateTime(n.notifiedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)]/60 px-3 py-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
    </div>
  );
}
