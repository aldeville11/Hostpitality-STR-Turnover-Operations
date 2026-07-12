import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { InventoryList } from "@/components/inventory/inventory-list";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; propertyId?: string; lowStock?: string }>;
}) {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");

  const filters = await searchParams;

  const [items, properties] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { companyId: user.companyId },
      include: {
        property: { select: { id: true, name: true, unitCode: true } },
      },
      orderBy: [{ name: "asc" }],
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
        title="Inventory"
        description="Track supply levels and reorder alerts across properties."
      />
      <InventoryList
        items={items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
          unit: item.unit,
          property: item.property,
        }))}
        filters={filters}
        properties={properties}
      />
    </div>
  );
}
