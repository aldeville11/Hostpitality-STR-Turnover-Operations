import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getTurnoverDetail } from "@/lib/turnovers";
import { PageHeader } from "@/components/ui";
import { TurnoverDetail } from "@/components/turnovers/turnover-detail";

export default async function TurnoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");
  if (!can(user.role, "turnovers:manage") && !can(user.role, "turnovers:execute")) {
    redirect("/dashboard");
  }

  const data = await getTurnoverDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.turnover.property.name}
        description={`${data.turnover.property.unitCode} · Turnover operations record`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/turnovers"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
            >
              All turnovers
            </Link>
            <Link
              href={`/properties/${data.turnover.propertyId}`}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
            >
              Property
            </Link>
          </div>
        }
      />
      <TurnoverDetail
        data={data}
        canManage={can(user.role, "turnovers:manage")}
        canAssign={can(user.role, "assignments:manage")}
      />
    </div>
  );
}
