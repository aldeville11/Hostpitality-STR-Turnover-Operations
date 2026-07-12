import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listIssues } from "@/lib/issues";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { IssueList } from "@/components/issues/issue-list";
import { IssueForm } from "@/components/issues/issue-form";
import { formatDateTime } from "@/lib/utils";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) redirect("/onboarding");

  const sp = await searchParams;
  const filters = {
    status: typeof sp.status === "string" ? sp.status : undefined,
    severity: typeof sp.severity === "string" ? sp.severity : undefined,
    propertyId: typeof sp.propertyId === "string" ? sp.propertyId : undefined,
    from: typeof sp.from === "string" ? sp.from : undefined,
    to: typeof sp.to === "string" ? sp.to : undefined,
    q: typeof sp.q === "string" ? sp.q : undefined,
    blocking: typeof sp.blocking === "string" ? sp.blocking : undefined,
  };

  const [issues, properties, turnovers, vendors] = await Promise.all([
    listIssues(user.companyId, {
      ...filters,
      blocking: filters.blocking === "1" ? true : undefined,
    }),
    prisma.property.findMany({
      where: { companyId: user.companyId, active: true },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.turnover.findMany({
      where: {
        companyId: user.companyId,
        status: {
          in: [
            "SCHEDULED",
            "ASSIGNED",
            "IN_PROGRESS",
            "READY_FOR_QA",
            "NEEDS_REWORK",
            "BLOCKED",
            "OVERDUE",
          ],
        },
      },
      select: {
        id: true,
        status: true,
        windowStart: true,
        property: { select: { name: true, unitCode: true } },
      },
      orderBy: { windowStart: "desc" },
      take: 40,
    }),
    prisma.vendor.findMany({
      where: { companyId: user.companyId, active: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues"
        description="Track problems from QA failures, blocked turnovers, and field reports."
        actions={
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            Dashboard
          </Link>
        }
      />

      {can(user.role, "issues:manage") ? (
        <IssueForm
          properties={properties.map((p) => ({
            id: p.id,
            label: `${p.name} (${p.unitCode})`,
          }))}
          turnovers={turnovers.map((t) => ({
            id: t.id,
            label: `${t.property.name} · ${t.status} · ${formatDateTime(t.windowStart)}`,
          }))}
          vendors={vendors.map((v) => ({
            id: v.id,
            label: `${v.name} (${v.type})`,
          }))}
          defaultPropertyId={filters.propertyId}
        />
      ) : null}

      <IssueList issues={issues} filters={filters} properties={properties} />
    </div>
  );
}
