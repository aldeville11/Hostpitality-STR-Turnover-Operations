import Link from "next/link";
import { Badge, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { mapIssueSeverity, mapIssueStatus } from "@/lib/status-map";

export function OpenIssues({ issues }: { issues: DashboardData["openIssues"] }) {
  return (
    <ModuleCard
      title="Open issues"
      description="Active defects and guest-impacting items across the portfolio."
      actions={
        <>
          <Badge tone={issues.length ? "warning" : "success"}>{issues.length}</Badge>
          <Link
            href="/issues"
            className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
          >
            View all
          </Link>
        </>
      }
    >
      {issues.length === 0 ? (
        <EmptyState
          title="No open issues"
          description="Unresolved damage, missing items, and QA failures will appear here when reported."
          action={
            <Link
              href="/issues"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Open issues →
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/issues/${issue.id}`}
                className="flex min-h-11 flex-wrap items-start justify-between gap-3 py-3 transition-colors hover:bg-[var(--surface-raised)]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{issue.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {issue.turnover?.property
                      ? `${issue.turnover.property.name} · ${issue.turnover.property.unitCode}`
                      : "Unlinked turnover"}
                    {" · "}
                    {formatDateTime(issue.createdAt)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                    {issue.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={mapIssueSeverity(issue.severity)}>
                    {issue.severity}
                  </StatusBadge>
                  <StatusBadge status={mapIssueStatus(issue.status)}>
                    {statusLabel(issue.status)}
                  </StatusBadge>
                  <Badge tone="neutral">{issue.category}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
