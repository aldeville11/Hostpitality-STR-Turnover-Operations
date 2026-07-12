"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import { QA_STATUSES, QA_STATUS_LABELS, type listQaQueue } from "@/lib/qa";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { mapQaStatus, mapTurnoverStatus } from "@/lib/status-map";

type QueueRow = Awaited<ReturnType<typeof listQaQueue>>[number];

export function QaQueue({
  items,
  filters,
  properties,
  inspectors,
}: {
  items: QueueRow[];
  filters: {
    status?: string;
    propertyId?: string;
    inspectorId?: string;
    q?: string;
  };
  properties: { id: string; name: string; unitCode: string }[];
  inspectors: { id: string; name: string }[];
}) {
  const columns: DataTableColumn<QueueRow>[] = [
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
      id: "qaStatus",
      header: "QA status",
      sortable: true,
      sortValue: (r) => r.qaStatus,
      cell: (r) => (
        <StatusBadge status={mapQaStatus(r.qaStatus)}>
          {QA_STATUS_LABELS[r.qaStatus as keyof typeof QA_STATUS_LABELS] ?? r.qaStatus}
        </StatusBadge>
      ),
    },
    {
      id: "turnover",
      header: "Turnover",
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
      id: "progress",
      header: "Checklist",
      sortable: true,
      sortValue: (r) =>
        r.checklistProgress.total
          ? r.checklistProgress.done / r.checklistProgress.total
          : -1,
      cell: (r) =>
        r.checklistProgress.total
          ? `${r.checklistProgress.done}/${r.checklistProgress.total}`
          : "—",
    },
    {
      id: "inspector",
      header: "Inspector",
      sortable: true,
      sortValue: (r) => r.latestQa?.inspectorName ?? "",
      cell: (r) => r.latestQa?.inspectorName ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/qa"
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
            label: "QA status",
            emptyLabel: "Queue (pending / rework)",
            defaultValue: filters.status,
            options: QA_STATUSES.map((s) => ({ value: s, label: QA_STATUS_LABELS[s] })),
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
            type: "select",
            name: "inspectorId",
            label: "Inspector",
            emptyLabel: "All inspectors",
            defaultValue: filters.inspectorId,
            options: inspectors.map((i) => ({ value: i.id, label: i.name })),
          },
        ]}
      />

      <ModuleCard
        title="QA queue"
        description="Pass/fail inspection against property SOP and SOW for turnovers ready for review."
        actions={<Badge tone="accent">{items.length} shown</Badge>}
      >
        <SortableDataTable
          columns={columns}
          rows={items}
          initialSortKey="deadline"
          initialSortDir="asc"
          onRowHref={(r) => `/qa/${r.id}`}
          emptyTitle="QA queue is clear"
          emptyDescription="Turnovers marked Ready for QA will appear here for pass/fail inspection against the property SOP and SOW."
          mobileCard={(r) => (
            <Link
              href={`/qa/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.property.name} · {r.property.unitCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Due {formatDateTime(r.deadlineAt)}
                  </p>
                </div>
                <StatusBadge status={mapQaStatus(r.qaStatus)}>
                  {QA_STATUS_LABELS[r.qaStatus as keyof typeof QA_STATUS_LABELS] ?? r.qaStatus}
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
