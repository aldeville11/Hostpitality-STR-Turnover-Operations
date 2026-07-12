"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  TYPE_LABELS,
  VENDOR_TYPES,
  type listCleaners,
} from "@/lib/cleaners";
import { mapAvailability } from "@/lib/status-map";

type CleanerRow = Awaited<ReturnType<typeof listCleaners>>[number];

export function CleanerList({
  cleaners,
  filters,
  unassignedCount,
}: {
  cleaners: CleanerRow[];
  filters: { type?: string; availability?: string; q?: string };
  unassignedCount: number;
}) {
  const columns: DataTableColumn<CleanerRow>[] = [
    {
      id: "name",
      header: "Cleaner",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <span>
          <span className="font-medium">{r.name}</span>
          {r.email ? (
            <span className="ml-1 text-xs text-[var(--muted)]">{r.email}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "type",
      header: "Role",
      sortable: true,
      sortValue: (r) => r.type,
      cell: (r) => TYPE_LABELS[r.type as keyof typeof TYPE_LABELS] ?? r.type,
    },
    {
      id: "availability",
      header: "Availability",
      sortable: true,
      sortValue: (r) => r.availabilityStatus,
      cell: (r) => (
        <StatusBadge status={mapAvailability(r.availabilityStatus)}>
          {AVAILABILITY_LABELS[r.availabilityStatus as keyof typeof AVAILABILITY_LABELS] ??
            r.availabilityStatus}
        </StatusBadge>
      ),
    },
    {
      id: "open",
      header: "Open load",
      sortable: true,
      sortValue: (r) => r.openLoad,
      cell: (r) => <span className="tabular-nums">{r.openLoad}</span>,
    },
    {
      id: "today",
      header: "Today",
      sortable: true,
      sortValue: (r) => r.todayLoad,
      cell: (r) => <span className="tabular-nums">{r.todayLoad}</span>,
    },
    {
      id: "capacity",
      header: "Capacity",
      sortable: true,
      sortValue: (r) => r.loadPct,
      cell: (r) => (
        <div className="min-w-[100px]">
          <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
            <span>{r.loadPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${Math.min(100, r.loadPct)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: "next",
      header: "Next assignment",
      sortable: false,
      cell: (r) => {
        const next = r.upcoming[0];
        if (!next) return <span className="text-[var(--muted)]">None</span>;
        return (
          <span className="text-[var(--text-secondary)]">
            {next.propertyName} · {next.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/cleaners"
        fields={[
          {
            type: "search",
            name: "q",
            placeholder: "Search cleaners",
            defaultValue: filters.q,
          },
          {
            type: "select",
            name: "type",
            label: "Role",
            emptyLabel: "All roles",
            defaultValue: filters.type,
            options: VENDOR_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
          },
          {
            type: "select",
            name: "availability",
            label: "Availability",
            emptyLabel: "All availability",
            defaultValue: filters.availability,
            options: AVAILABILITY_STATUSES.map((s) => ({
              value: s,
              label: AVAILABILITY_LABELS[s],
            })),
          },
        ]}
      />

      <ModuleCard
        title="Cleaner roster"
        description="Workforce availability, open load, and upcoming coverage."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{cleaners.length} on roster</Badge>
            {unassignedCount > 0 ? (
              <Badge tone="warning">{unassignedCount} unassigned turnovers</Badge>
            ) : (
              <Badge tone="success">No unassigned gaps this week</Badge>
            )}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={cleaners}
          initialSortKey="name"
          onRowHref={(r) => `/cleaners/${r.id}`}
          emptyTitle="No cleaners match"
          emptyDescription="Add cleaners and vendors during onboarding, then use this board to assign coverage and watch workload."
          mobileCard={(r) => (
            <Link
              href={`/cleaners/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {TYPE_LABELS[r.type as keyof typeof TYPE_LABELS] ?? r.type} · Open {r.openLoad}
                  </p>
                </div>
                <StatusBadge status={mapAvailability(r.availabilityStatus)}>
                  {AVAILABILITY_LABELS[
                    r.availabilityStatus as keyof typeof AVAILABILITY_LABELS
                  ] ?? r.availabilityStatus}
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
