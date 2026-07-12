"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { mapInventoryStock } from "@/lib/status-map";

export type InventoryRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  property: { id: string; name: string; unitCode: string } | null;
};

export function InventoryList({
  items,
  filters,
  properties,
}: {
  items: InventoryRow[];
  filters: { q?: string; propertyId?: string; lowStock?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    return items.filter((item) => {
      if (filters.propertyId && item.property?.id !== filters.propertyId) return false;
      if (filters.lowStock === "1" && item.quantity > item.reorderLevel) return false;
      if (!q) return true;
      const hay = `${item.name} ${item.category} ${item.property?.name ?? ""} ${item.property?.unitCode ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filters]);

  const lowCount = filtered.filter((i) => i.quantity <= i.reorderLevel).length;

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      id: "name",
      header: "Item",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      sortValue: (r) => r.category,
      cell: (r) => <span className="capitalize">{r.category}</span>,
    },
    {
      id: "property",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.property?.name ?? "",
      cell: (r) =>
        r.property ? (
          <Link
            href={`/properties/${r.property.id}`}
            className="text-[var(--accent-strong)] hover:underline"
          >
            {r.property.name} · {r.property.unitCode}
          </Link>
        ) : (
          <span className="text-[var(--muted)]">Company stock</span>
        ),
    },
    {
      id: "qty",
      header: "Quantity",
      sortable: true,
      sortValue: (r) => r.quantity,
      cell: (r) => (
        <span className="tabular-nums">
          {r.quantity} {r.unit}
        </span>
      ),
    },
    {
      id: "reorder",
      header: "Reorder at",
      sortable: true,
      sortValue: (r) => r.reorderLevel,
      cell: (r) => <span className="tabular-nums">{r.reorderLevel}</span>,
    },
    {
      id: "stock",
      header: "Stock status",
      sortable: true,
      sortValue: (r) => (r.quantity <= 0 ? 2 : r.quantity <= r.reorderLevel ? 1 : 0),
      cell: (r) => {
        const status = mapInventoryStock(r.quantity, r.reorderLevel);
        const label =
          r.quantity <= 0 ? "Out of stock" : r.quantity <= r.reorderLevel ? "Low stock" : "Healthy";
        return <StatusBadge status={status}>{label}</StatusBadge>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/inventory"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search items or properties",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "propertyId",
            label: "Property",
            emptyLabel: "All properties",
            defaultValue: filters.propertyId,
            options: properties.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.unitCode})`,
            })),
          },
          {
            type: "checkbox",
            name: "lowStock",
            label: "Low stock only",
            value: "1",
            defaultChecked: filters.lowStock === "1",
          },
        ]}
      />

      <ModuleCard
        title="Inventory"
        description="Supply levels and reorder alerts across properties. Stock is managed in property context."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{filtered.length} shown</Badge>
            {lowCount ? <Badge tone="warning">{lowCount} low / out</Badge> : null}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={filtered}
          initialSortKey="stock"
          initialSortDir="desc"
          emptyTitle="No inventory items"
          emptyDescription="Inventory items appear when seeded or attached to properties. Open a property to review local supply context."
          emptyAction={
            <Link
              href="/properties"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              View properties →
            </Link>
          }
          mobileCard={(r) => (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.property
                      ? `${r.property.name} · ${r.property.unitCode}`
                      : "Company stock"}{" "}
                    · {r.quantity} {r.unit}
                  </p>
                </div>
                <StatusBadge status={mapInventoryStock(r.quantity, r.reorderLevel)}>
                  {r.quantity <= r.reorderLevel ? "Low" : "OK"}
                </StatusBadge>
              </div>
            </div>
          )}
        />
      </ModuleCard>
    </div>
  );
}
