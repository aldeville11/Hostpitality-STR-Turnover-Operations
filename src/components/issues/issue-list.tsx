import Link from "next/link";
import { Badge } from "@/components/ui";
import { IssueCard } from "@/components/issues/issue-card";
import {
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type listIssues,
} from "@/lib/issues";

type IssueRow = Awaited<ReturnType<typeof listIssues>>[number];

export function IssueList({
  issues,
  filters,
  properties,
}: {
  issues: IssueRow[];
  filters: {
    status?: string;
    severity?: string;
    propertyId?: string;
    from?: string;
    to?: string;
    q?: string;
    blocking?: string;
  };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const blockingCount = issues.filter((i) => i.blocking && i.sla.overdue === false).length;
  const overdueCount = issues.filter((i) => i.sla.overdue).length;

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search issues"
          className="min-w-[150px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ISSUE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="severity"
          defaultValue={filters.severity ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All severities</option>
          {ISSUE_SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="propertyId"
          defaultValue={filters.propertyId ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.unitCode})
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="blocking"
            value="1"
            defaultChecked={filters.blocking === "1"}
          />
          Blocking only
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <Link
          href="/issues"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{issues.length} shown</Badge>
        {overdueCount ? <Badge tone="danger">{overdueCount} overdue</Badge> : null}
        {blockingCount ? <Badge tone="warning">{blockingCount} blocking</Badge> : null}
      </div>

      {issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            No issues match
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Create an issue from QA failures, a blocked turnover, or manual entry to start tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
