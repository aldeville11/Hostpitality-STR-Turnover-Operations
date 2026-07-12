import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui";
import { createInventoryAction, updateInventoryAction, approveAgentAction } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";
import { agentLabel } from "@/lib/agents";

export default async function InventoryPage() {
  const user = await requireUser({ permission: "inventory:manage" });
  if (!user.companyId) redirect("/onboarding");

  const [items, properties, restockActions] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { companyId: user.companyId },
      include: { property: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({ where: { companyId: user.companyId } }),
    prisma.agentAction.findMany({
      where: { companyId: user.companyId, agentType: "INVENTORY_RESTOCK", status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track supply levels, reorder alerts, and restock agent proposals."
      />

      {restockActions.length > 0 ? (
        <div className="mb-6 space-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <p className="font-semibold text-amber-900">Restock approvals</p>
          {restockActions.map((action) => (
            <div key={action.id} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-amber-800">
                  {agentLabel(action.agentType)} · {action.description}
                </p>
              </div>
              <form action={approveAgentAction}>
                <input type="hidden" name="id" value={action.id} />
                <input type="hidden" name="decision" value="approve" />
                <Button type="submit" size="sm">
                  Approve restock
                </Button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {items.length === 0 ? (
            <EmptyState title="No inventory items" description="Add supplies to track restock needs." />
          ) : (
            items.map((item) => {
              const low = item.quantity <= item.reorderLevel;
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {item.category}
                      {item.property ? ` · ${item.property.name}` : " · Shared"}
                      {item.lastRestockedAt
                        ? ` · Restocked ${formatDateTime(item.lastRestockedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {low ? <Badge tone="warning">Below reorder</Badge> : <Badge tone="success">OK</Badge>}
                    <form action={updateInventoryAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <Input
                        name="quantity"
                        type="number"
                        defaultValue={item.quantity}
                        className="w-24"
                      />
                      <span className="text-xs text-[var(--muted)]">{item.unit}</span>
                      <Button type="submit" size="sm" variant="outline">
                        Update
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          action={createInventoryAction}
          className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Add item</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue="supplies" />
          </div>
          <div>
            <Label htmlFor="propertyId">Property (optional)</Label>
            <Select id="propertyId" name="propertyId" defaultValue="">
              <option value="">Shared / company</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="quantity">Qty</Label>
              <Input id="quantity" name="quantity" type="number" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" defaultValue={5} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue="each" />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Save item
          </Button>
        </form>
      </div>
    </div>
  );
}
