"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { SOW_STATUSES, STATUS_LABELS, type listSows } from "@/lib/sows";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";
import { mapSowStatus } from "@/lib/status-map";
import { formatDateTime } from "@/lib/utils";

type SowRow = Awaited<ReturnType<typeof listSows>>[number];

function propertiesLabel(properties: SowRow["properties"]) {
  if (properties.length === 0) return "No properties";
  if (properties.length === 1) {
    return `${properties[0].name} (${properties[0].unitCode})`;
  }
  return `${properties.length} properties`;
}

export function SowList({
  sows,
  filters,
  properties,
}: {
  sows: SowRow[];
  filters: { status?: string; propertyId?: string; unitType?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const activeCount = sows.filter((s) => s.status === "ACTIVE").length;

  const columns: DataTableColumn<SowRow>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <span>
          <span className="font-medium">{r.name}</span>
          {r.isActiveTemplate ? (
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-strong)]">
              Active
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "useCase",
      header: "Use case / service",
      sortable: true,
      sortValue: (r) => r.useCase ?? r.unitType ?? "",
      cell: (r) => {
        const label = r.useCase ?? (r.unitType ? unitTypeLabel(r.unitType) : null);
        return label ? (
          <span className="text-[var(--text-secondary)]">{label}</span>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        );
      },
    },
    {
      id: "version",
      header: "Version",
      sortable: true,
      sortValue: (r) => r.version,
      cell: (r) => <span className="tabular-nums">v{r.version}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusBadge status={mapSowStatus(r.status)}>
          {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
        </StatusBadge>
      ),
    },
    {
      id: "propertyGroup",
      header: "Property group",
      sortable: true,
      sortValue: (r) => r.propertyGroup ?? "",
      cell: (r) =>
        r.propertyGroup ? (
          r.propertyGroup
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    {
      id: "usage",
      header: "Usage",
      sortable: true,
      sortValue: (r) => r._count.turnovers,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{r._count.turnovers} TO</span>
      ),
    },
    {
      id: "updated",
      header: "Last updated",
      sortable: true,
      sortValue: (r) => r.updatedAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-[var(--text-secondary)]">
          {formatDateTime(r.updatedAt)}
        </span>
      ),
    },
    {
      id: "properties",
      header: "Properties",
      sortable: true,
      sortValue: (r) => r.properties.length,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{propertiesLabel(r.properties)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/sows"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search templates",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            emptyLabel: "All statuses",
            defaultValue: filters.status,
            options: SOW_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          },
          {
            type: "select",
            name: "unitType",
            label: "Unit type",
            emptyLabel: "All unit types",
            defaultValue: filters.unitType,
            options: UNIT_TYPES.map((t) => ({ value: t, label: unitTypeLabel(t) })),
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
        ]}
      />

      <ModuleCard
        title="SOW library"
        description="Service scope templates for standard work, add-ons, photo proof, SLAs, and approval gates."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{sows.length} shown</Badge>
            {activeCount ? <Badge tone="success">{activeCount} active</Badge> : null}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={sows}
          initialSortKey="updated"
          initialSortDir="desc"
          onRowHref={(r) => `/sows/${r.id}`}
          emptyTitle="No SOW templates yet"
          emptyDescription="Create a service scope template with standard work, add-ons, photo proof, SLA, and approval gates — then activate it for properties."
          mobileCard={(r) => (
            <Link
              href={`/sows/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.useCase ?? "No use case"} · v{r.version} · {formatDateTime(r.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={mapSowStatus(r.status)}>
                  {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
