import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getIssueDetail } from "@/lib/issues";
import { PageHeader } from "@/components/ui";
import { IssueDetail } from "@/components/issues/issue-detail";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getIssueDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.issue.title}
        description={`${data.issue.property?.name ?? "No property"} · Issue tracking`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/issues"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
            >
              All issues
            </Link>
            {data.issue.turnoverId ? (
              <Link
                href={`/turnovers/${data.issue.turnoverId}`}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
              >
                Turnover
              </Link>
            ) : null}
          </div>
        }
      />
      <IssueDetail data={data} canManage={can(user.role, "issues:manage")} />
    </div>
  );
}
