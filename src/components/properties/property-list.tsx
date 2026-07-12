"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import type { listProperties } from "@/lib/properties";
import { unitTypeLabel } from "@/lib/properties";
import { mapActive, mapReadiness } from "@/lib/status-map";

type PropertyListItem = Awaited<ReturnType<typeof listProperties>>[number];

export function PropertyList({
  properties,
  filters,
}: {
  properties: PropertyListItem[];
  filters: { q?: string; active?: string };
}) {
  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    return properties.filter((p) => {
      if (filters.active === "1" && !p.active) return false;
      if (filters.active === "0" && p.active) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.unitCode} ${p.city} ${p.address} ${p.defaultVendor?.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [properties, filters]);

  const ready = filtered.filter((p) => p.readiness.label === "Ready").length;

  const columns: DataTableColumn<PropertyListItem>[] = [
    {
      id: "name",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <span>
          <span className="font-medium">{r.name}</span>
          <span className="ml-1 text-[var(--muted)]">· {r.unitCode}</span>
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      sortable: true,
      sortValue: (r) => `${r.city}, ${r.state}`,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">
          {r.city}, {r.state}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      sortable: true,
      sortValue: (r) => r.unitType,
      cell: (r) => unitTypeLabel(r.unitType),
    },
    {
      id: "beds",
      header: "Beds / Baths",
      sortable: true,
      sortValue: (r) => r.bedrooms,
      cell: (r) => `${r.bedrooms} / ${r.bathrooms}`,
    },
    {
      id: "active",
      header: "Status",
      sortable: true,
      sortValue: (r) => (r.active ? 1 : 0),
      cell: (r) => (
        <StatusBadge status={mapActive(r.active)}>
          {r.active ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      id: "readiness",
      header: "Readiness",
      sortable: true,
      sortValue: (r) => r.readiness.score,
      cell: (r) => (
        <StatusBadge status={mapReadiness(r.readiness.label)}>
          {r.readiness.label} · {r.readiness.score}%
        </StatusBadge>
      ),
    },
    {
      id: "cleaner",
      header: "Default cleaner",
      sortable: true,
      sortValue: (r) => r.defaultVendor?.name ?? "",
      cell: (r) =>
        r.defaultVendor?.name ?? (
          <span className="text-[var(--warning)]">Unassigned</span>
        ),
    },
    {
      id: "volume",
      header: "Activity",
      sortable: true,
      sortValue: (r) => r._count.turnovers,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">
          {r._count.turnovers} TO · {r._count.bookings} bookings
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/properties"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search name, unit, city, cleaner",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "active",
            label: "Status",
            emptyLabel: "All statuses",
            defaultValue: filters.active,
            options: [
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ],
          },
        ]}
      />

      <ModuleCard
        title="Properties"
        description="STR units with operational context for calendars, SOPs, SOWs, and cleaners."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{filtered.length} shown</Badge>
            <Badge tone="success">{ready} ready</Badge>
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={filtered}
          initialSortKey="name"
          onRowHref={(r) => `/properties/${r.id}`}
          emptyTitle="No properties match"
          emptyDescription="Add an STR unit or clear filters to see portfolio inventory."
          mobileCard={(r) => (
            <Link
              href={`/properties/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.name} · {r.unitCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.city}, {r.state}
                  </p>
                </div>
                <StatusBadge status={mapReadiness(r.readiness.label)}>
                  {r.readiness.score}%
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
