import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listQaQueue } from "@/lib/qa";
import { prisma } from "@/lib/db";
import { propertyScopeWhere } from "@/lib/access-scope";
import { PageHeader } from "@/components/ui";
import { QaQueue } from "@/components/qa/qa-queue";

export default async function QaPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    propertyId?: string;
    inspectorId?: string;
    q?: string;
  }>;
}) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) redirect("/onboarding");

  const filters = await searchParams;
  const [items, properties, inspectors] = await Promise.all([
    listQaQueue(
      user.companyId,
      {
        status: filters.status || undefined,
        propertyId: filters.propertyId || undefined,
        inspectorId: filters.inspectorId || undefined,
        q: filters.q || undefined,
      },
      user.accessScope
    ),
    prisma.property.findMany({
      where: { companyId: user.companyId, active: true, ...propertyScopeWhere(user.accessScope) },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId: user.companyId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="QA / Photo Review"
        description="Verify turnover work against the property SOP and SOW — pass/fail checklist items, review photos, and approve or send back for rework."
      />
      <QaQueue
        items={items}
        filters={filters}
        properties={properties}
        inspectors={inspectors}
      />
    </div>
  );
}
