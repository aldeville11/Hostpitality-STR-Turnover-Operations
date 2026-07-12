import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listTurnovers } from "@/lib/turnovers";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { TurnoverList } from "@/components/turnovers/turnover-list";
import { TurnoverToolbar } from "@/components/turnovers/turnover-toolbar";

export default async function TurnoversPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; propertyId?: string; q?: string }>;
}) {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");
  if (!can(user.role, "turnovers:manage") && !can(user.role, "turnovers:execute")) {
    redirect("/dashboard");
  }

  const filters = await searchParams;
  const [turnovers, properties] = await Promise.all([
    listTurnovers(user.companyId, {
      status: filters.status || undefined,
      propertyId: filters.propertyId || undefined,
      q: filters.q || undefined,
    }),
    prisma.property.findMany({
      where: { companyId: user.companyId, active: true },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const canManage = can(user.role, "turnovers:manage");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Turnovers"
        description="Checkout windows become scheduled cleaning jobs — assign cleaners, run checklists, and advance status through Ready for QA."
      />
      {canManage ? <TurnoverToolbar properties={properties} /> : null}
      <TurnoverList turnovers={turnovers} filters={filters} properties={properties} />
    </div>
  );
}
