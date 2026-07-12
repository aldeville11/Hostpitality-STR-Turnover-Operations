"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type listIssues,
} from "@/lib/issues";
import { formatDateTime } from "@/lib/utils";
import { mapIssueSeverity, mapIssueStatus } from "@/lib/status-map";

type IssueRow = Awaited<ReturnType<typeof listIssues>>[number];

export function IssueList({
  issues,
  filters,
  properties,
}: {
  issues: IssueRow[];
  filters: {
    status?: string;
    severity?: string;
    propertyId?: string;
    from?: string;
    to?: string;
    q?: string;
    blocking?: string;
  };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const blockingCount = issues.filter((i) => i.blocking).length;
  const overdueCount = issues.filter((i) => i.sla.overdue).length;

  const columns: DataTableColumn<IssueRow>[] = [
    {
      id: "title",
      header: "Issue",
      sortable: true,
      sortValue: (r) => r.title,
      cell: (r) => <span className="line-clamp-1 font-medium">{r.title}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusBadge status={mapIssueStatus(r.status)}>
          {ISSUE_STATUS_LABELS[r.status as keyof typeof ISSUE_STATUS_LABELS] ?? r.status}
        </StatusBadge>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      sortable: true,
      sortValue: (r) => r.severity,
      cell: (r) => (
        <StatusBadge status={mapIssueSeverity(r.severity)}>{r.severity}</StatusBadge>
      ),
    },
    {
      id: "property",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.property?.name ?? "",
      cell: (r) =>
        r.property ? (
          <span>
            {r.property.name} · {r.property.unitCode}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "owner",
      header: "Owner",
      sortable: true,
      sortValue: (r) => r.ownerName ?? "",
      cell: (r) => r.ownerName ?? "—",
    },
    {
      id: "sla",
      header: "SLA",
      sortable: true,
      sortValue: (r) => (r.sla.overdue ? 2 : r.blocking ? 1 : 0),
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.blocking ? <Badge tone="warning">Blocking</Badge> : null}
          {r.sla.overdue ? <Badge tone="danger">Overdue</Badge> : null}
          {!r.blocking && !r.sla.overdue ? (
            <span className="text-[var(--muted)]">On track</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "created",
      header: "Created",
      sortable: true,
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-[var(--text-secondary)]">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ListFilterBar
        resetHref="/issues"
        fields={[
          { type: "search", name: "q", placeholder: "Search issues", defaultValue: filters.q },
          {
            type: "select",
            name: "status",
            label: "Status",
            emptyLabel: "All statuses",
            defaultValue: filters.status,
            options: ISSUE_STATUSES.map((s) => ({ value: s, label: ISSUE_STATUS_LABELS[s] })),
          },
          {
            type: "select",
            name: "severity",
            label: "Severity",
            emptyLabel: "All severities",
            defaultValue: filters.severity,
            options: ISSUE_SEVERITIES.map((s) => ({ value: s, label: s })),
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
          { type: "date", name: "from", label: "From", defaultValue: filters.from },
          { type: "date", name: "to", label: "To", defaultValue: filters.to },
          {
            type: "checkbox",
            name: "blocking",
            label: "Blocking only",
            value: "1",
            defaultChecked: filters.blocking === "1",
          },
        ]}
      />

      <ModuleCard
        title="Issues"
        description="Problems from QA failures, blocked turnovers, and field reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{issues.length} shown</Badge>
            {overdueCount ? <Badge tone="danger">{overdueCount} overdue</Badge> : null}
            {blockingCount ? <Badge tone="warning">{blockingCount} blocking</Badge> : null}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={issues}
          initialSortKey="created"
          initialSortDir="desc"
          onRowHref={(r) => `/issues/${r.id}`}
          emptyTitle="No issues match"
          emptyDescription="Create an issue from QA failures, a blocked turnover, or manual entry to start tracking."
          mobileCard={(r) => (
            <Link
              href={`/issues/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold line-clamp-1">{r.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.property?.name ?? "No property"} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <StatusBadge status={mapIssueStatus(r.status)}>
                  {ISSUE_STATUS_LABELS[r.status as keyof typeof ISSUE_STATUS_LABELS] ?? r.status}
                </StatusBadge>
              </div>
            </Link>
          )}
        />
      </ModuleCard>
    </div>
  );
}
