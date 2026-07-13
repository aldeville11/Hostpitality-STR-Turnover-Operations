import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getTurnoverDetail } from "@/lib/turnovers";
import { Button, PageHeader } from "@/components/ui";
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

  const data = await getTurnoverDetail(user.companyId, id, user.accessScope);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.turnover.property.name}
        description={`${data.turnover.property.unitCode} · Turnover operations record`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/turnovers">
              <Button variant="outline" size="sm">
                All turnovers
              </Button>
            </Link>
            <Link href={`/properties/${data.turnover.propertyId}`}>
              <Button variant="outline" size="sm">
                Property
              </Button>
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
