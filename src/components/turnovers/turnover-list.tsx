"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import type { listTurnovers } from "@/lib/turnovers";
import { TURNOVER_STATUSES } from "@/lib/turnovers";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { mapTurnoverStatus } from "@/lib/status-map";

type TurnoverRow = Awaited<ReturnType<typeof listTurnovers>>[number];

export function TurnoverList({
  turnovers,
  filters,
  properties,
}: {
  turnovers: TurnoverRow[];
  filters: { status?: string; propertyId?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const columns: DataTableColumn<TurnoverRow>[] = [
    {
      id: "property",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.property.name,
      cell: (r) => (
        <span>
          {r.property.name}
          <span className="ml-1 text-[var(--muted)]">· {r.property.unitCode}</span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusBadge status={mapTurnoverStatus(r.status)}>{statusLabel(r.status)}</StatusBadge>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      sortable: true,
      sortValue: (r) => r.priority,
      cell: (r) => <Badge tone="neutral">{r.priority}</Badge>,
    },
    {
      id: "window",
      header: "Window",
      sortable: true,
      sortValue: (r) => r.windowStart,
      cell: (r) => (
        <span className="whitespace-nowrap text-[var(--text-secondary)]">
          {formatDateTime(r.windowStart)} – {formatDateTime(r.windowEnd)}
        </span>
      ),
    },
    {
      id: "deadline",
      header: "Deadline",
      sortable: true,
      sortValue: (r) => r.deadlineAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-[var(--text-secondary)]">
          {formatDateTime(r.deadlineAt)}
        </span>
      ),
    },
    {
      id: "assignee",
      header: "Assignee",
      sortable: true,
      sortValue: (r) => r.vendor?.name ?? "",
      cell: (r) => r.vendor?.name ?? <span className="text-[var(--warning)]">Unassigned</span>,
    },
    {
      id: "checklist",
      header: "Checklist",
      sortable: true,
      sortValue: (r) => {
        const total = r.checklistItems.length;
        if (!total) return -1;
        return r.checklistItems.filter((i) => i.completed).length / total;
      },
      cell: (r) => {
        const done = r.checklistItems.filter((i) => i.completed).length;
        const total = r.checklistItems.length;
        return total ? `${done}/${total}` : "—";
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/turnovers"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search property or cleaner",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            emptyLabel: "All statuses",
            defaultValue: filters.status,
            options: TURNOVER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
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
        title="Turnovers"
        description="Checkout windows and cleaning jobs across the portfolio."
        actions={<Badge tone="accent">{turnovers.length} shown</Badge>}
      >
        <SortableDataTable
          columns={columns}
          rows={turnovers}
          initialSortKey="window"
          initialSortDir="desc"
          onRowHref={(r) => `/turnovers/${r.id}`}
          emptyTitle="No turnovers match"
          emptyDescription="Sync calendars or create a turnover from a property booking window to start the cleaning workflow."
          emptyAction={
            <Link
              href="/properties"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              View properties →
            </Link>
          }
          mobileCard={(r) => (
            <Link
              href={`/turnovers/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.property.name} · {r.property.unitCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Due {formatDateTime(r.deadlineAt)} · {r.vendor?.name ?? "Unassigned"}
                  </p>
                </div>
                <StatusBadge status={mapTurnoverStatus(r.status)}>
                  {statusLabel(r.status)}
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
