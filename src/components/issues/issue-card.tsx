import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  ISSUE_STATUS_LABELS,
  issueStatusTone,
  type IssueStatus,
} from "@/lib/issues";
import { severityTone } from "@/lib/dashboard";
import { formatDateTime, statusLabel } from "@/lib/utils";

type IssueCardProps = {
  issue: {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    category: string;
    blocking: boolean;
    ownerName: string | null;
    assigneeName: string | null;
    createdAt: Date | string;
    property: { name: string; unitCode: string } | null;
    turnover: { id: string; status: string } | null;
    sla: {
      dueAt: Date;
      ageHours: number;
      overdue: boolean;
      escalationRisk: boolean;
    };
  };
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {issue.title}
            </p>
            {issue.blocking ? <Badge tone="danger">Blocking</Badge> : null}
            {issue.sla.overdue ? <Badge tone="danger">Overdue</Badge> : null}
            {issue.sla.escalationRisk && !issue.sla.overdue ? (
              <Badge tone="warning">Escalation risk</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{issue.description}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {issue.property
              ? `${issue.property.name} · ${issue.property.unitCode}`
              : "No property"}
            {issue.turnover ? ` · Turnover ${statusLabel(issue.turnover.status)}` : ""}
            {" · "}
            Owner {issue.ownerName ?? "—"}
            {issue.assigneeName ? ` · Assignee ${issue.assigneeName}` : ""}
            {" · "}
            Age {issue.sla.ageHours}h · Due {formatDateTime(issue.sla.dueAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={issueStatusTone(issue.status)}>
            {ISSUE_STATUS_LABELS[issue.status as IssueStatus] ?? statusLabel(issue.status)}
          </Badge>
          <Badge tone={severityTone(issue.severity)}>{issue.severity}</Badge>
          <Badge tone="neutral">{issue.category}</Badge>
        </div>
      </div>
    </Link>
  );
}
