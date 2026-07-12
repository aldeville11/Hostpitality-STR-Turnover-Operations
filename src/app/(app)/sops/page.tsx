import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listSops } from "@/lib/sops";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SopList } from "@/components/sops/sop-list";
import { TemplatePicker } from "@/components/sops/template-picker";
import { CreateSopForm } from "@/components/sops/create-sop-form";

export default async function SopsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; propertyId?: string; q?: string }>;
}) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) redirect("/onboarding");

  const filters = await searchParams;
  const [sops, properties] = await Promise.all([
    listSops(user.companyId, {
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

  const canManage = can(user.role, "sops:manage");

  return (
    <div>
      <PageHeader
        title="SOPs"
        description="Property playbooks that define room-by-room turnover execution — the checklist source for cleaning jobs."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SopList sops={sops} filters={filters} properties={properties} />
        </div>
        {canManage ? (
          <div className="space-y-6">
            <CreateSopForm />
            <TemplatePicker />
          </div>
        ) : null}
      </div>
    </div>
  );
}
