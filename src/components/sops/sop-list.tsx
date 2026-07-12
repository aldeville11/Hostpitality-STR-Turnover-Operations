"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { SOP_STATUSES, STATUS_LABELS, type listSops } from "@/lib/sops";
import { unitTypeLabel } from "@/lib/properties";
import { mapSopStatus } from "@/lib/status-map";
import { formatDateTime } from "@/lib/utils";

type SopRow = Awaited<ReturnType<typeof listSops>>[number];

function propertyScopeLabel(properties: SopRow["properties"]) {
  if (properties.length === 0) return "No properties";
  if (properties.length === 1) {
    return `${properties[0].name} (${properties[0].unitCode})`;
  }
  return `${properties.length} properties`;
}

export function SopList({
  sops,
  filters,
  properties,
}: {
  sops: SopRow[];
  filters: { status?: string; propertyId?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const publishedCount = sops.filter((s) => s.status === "PUBLISHED").length;

  const columns: DataTableColumn<SopRow>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <span>
          <span className="font-medium">{r.name}</span>
          {r.isActivePublished ? (
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-strong)]">
              Active
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category / unit type",
      sortable: true,
      sortValue: (r) => r.unitType ?? "",
      cell: (r) =>
        r.unitType ? (
          unitTypeLabel(r.unitType)
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    {
      id: "scope",
      header: "Property scope",
      sortable: true,
      sortValue: (r) => r.properties.length,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{propertyScopeLabel(r.properties)}</span>
      ),
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
        <StatusBadge status={mapSopStatus(r.status)}>
          {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status}
        </StatusBadge>
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
      id: "usage",
      header: "Usage",
      sortable: true,
      sortValue: (r) => r._count.turnovers,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">
          {r._count.turnovers} TO · {r._count.versions} ver
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/sops"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search SOPs",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            emptyLabel: "All statuses",
            defaultValue: filters.status,
            options: SOP_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
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
        title="SOP library"
        description="Property playbooks that define room-by-room turnover execution."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{sops.length} shown</Badge>
            {publishedCount ? (
              <Badge tone="success">{publishedCount} published</Badge>
            ) : null}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={sops}
          initialSortKey="updated"
          initialSortDir="desc"
          onRowHref={(r) => `/sops/${r.id}`}
          emptyTitle="No SOPs yet"
          emptyDescription="Start from a rental-type template or create a blank playbook. Published SOPs become the checklist source for turnovers."
          mobileCard={(r) => (
            <Link
              href={`/sops/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    v{r.version} · {propertyScopeLabel(r.properties)} ·{" "}
                    {formatDateTime(r.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={mapSopStatus(r.status)}>
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
