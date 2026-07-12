import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, PageHeader, Select } from "@/components/ui";
import { updateIssueStatusAction } from "@/lib/actions";
import { formatDateTime, statusLabel } from "@/lib/utils";

export default async function IssuesPage() {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) redirect("/onboarding");

  const issues = await prisma.issue.findMany({
    where: { turnover: { companyId: user.companyId } },
    include: {
      turnover: { include: { property: true } },
      reportedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Issues"
        description="Damage, missing items, and clean misses escalated from the field."
      />

      {issues.length === 0 ? (
        <EmptyState title="No issues" description="Escalations from turnovers will show up here." />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{issue.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{issue.description}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    <Link href={`/turnovers/${issue.turnoverId}`} className="text-[var(--accent)]">
                      {issue.turnover.property.name}
                    </Link>{" "}
                    · {formatDateTime(issue.createdAt)}
                    {issue.reportedBy ? ` · ${issue.reportedBy.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      issue.severity === "CRITICAL" || issue.severity === "HIGH" ? "danger" : "warning"
                    }
                  >
                    {issue.severity}
                  </Badge>
                  <Badge>{statusLabel(issue.status)}</Badge>
                  <Badge tone="neutral">{issue.category}</Badge>
                </div>
              </div>
              <form action={updateIssueStatusAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={issue.id} />
                <Select name="status" defaultValue={issue.status} className="w-40">
                  <option value="OPEN">Open</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </Select>
                <Button type="submit" size="sm" variant="outline">
                  Update status
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
