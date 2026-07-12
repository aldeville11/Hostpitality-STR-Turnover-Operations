import Link from "next/link";
import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { severityTone } from "@/lib/dashboard";
import { formatDateTime, statusLabel } from "@/lib/utils";

export function OpenIssues({ issues }: { issues: DashboardData["openIssues"] }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Open issues
        </h2>
        <div className="flex items-center gap-2">
          <Badge tone={issues.length ? "warning" : "success"}>{issues.length}</Badge>
          <Link href="/issues" className="text-sm text-[var(--accent)] hover:underline">
            All
          </Link>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No unresolved damage, missing items, or QA failures. Field escalations will appear here.
        </p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="block rounded-xl border border-[var(--border)] px-3 py-3 transition hover:border-[var(--accent)]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {issue.turnover?.property
                      ? `${issue.turnover.property.name} · ${issue.turnover.property.unitCode}`
                      : "Unlinked turnover"}
                    {" · "}
                    {formatDateTime(issue.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={severityTone(issue.severity)}>{issue.severity}</Badge>
                  <Badge>{statusLabel(issue.status)}</Badge>
                  <Badge tone="neutral">{issue.category}</Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{issue.description}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
