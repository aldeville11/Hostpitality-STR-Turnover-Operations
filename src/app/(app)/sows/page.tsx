import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listSows } from "@/lib/sows";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SowList } from "@/components/sows/sow-list";
import { CreateSowForm } from "@/components/sows/create-sow-form";

export default async function SowsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    propertyId?: string;
    unitType?: string;
    q?: string;
  }>;
}) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) redirect("/onboarding");

  const filters = await searchParams;
  const [sows, properties] = await Promise.all([
    listSows(user.companyId, {
      status: filters.status || undefined,
      propertyId: filters.propertyId || undefined,
      unitType: filters.unitType || undefined,
      q: filters.q || undefined,
    }),
    prisma.property.findMany({
      where: { companyId: user.companyId, active: true },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="SOW Templates"
        description="Service scope templates that define what a turnover includes, optional add-ons, photo proof, SLAs, and approval gates."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <SowList sows={sows} filters={filters} properties={properties} />
        </div>
        {can(user.role, "sow:manage") ? (
          <div>
            <CreateSowForm />
          </div>
        ) : null}
      </div>
    </div>
  );
}
