import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getIssueDetail } from "@/lib/issues";
import { Button, PageHeader } from "@/components/ui";
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
            <Link href="/issues">
              <Button variant="outline" size="sm">
                All issues
              </Button>
            </Link>
            {data.issue.turnoverId ? (
              <Link href={`/turnovers/${data.issue.turnoverId}`}>
                <Button variant="outline" size="sm">
                  Turnover
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <IssueDetail data={data} canManage={can(user.role, "issues:manage")} />
    </div>
  );
}
