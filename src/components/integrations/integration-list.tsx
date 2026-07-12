"use client";

import Link from "next/link";
import { Badge, ModuleCard, StatusBadge } from "@/components/ui";
import { SortableDataTable } from "@/components/ui/sortable-data-table";
import type { DataTableColumn } from "@/components/ui/data-table";
import {
  formatSyncTime,
  type IntegrationListItem,
} from "@/lib/integrations";
import { mapIntegrationStatus } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

function connectionState(integration: IntegrationListItem) {
  if (integration.status === "CONNECTED" || integration.status === "SYNCING") {
    return integration.externalAccount ?? "Connected";
  }
  if (integration.status === "ERROR") {
    return integration.externalAccount ?? "Error";
  }
  if (integration.status === "DISABLED") {
    return "Disabled";
  }
  return "Disconnected";
}

function healthStatus(integration: IntegrationListItem) {
  if (integration.status === "ERROR" || integration.lastError) {
    return mapIntegrationStatus("ERROR");
  }
  if (!integration.enabled && integration.status === "CONNECTED") {
    return mapIntegrationStatus("DISABLED");
  }
  return mapIntegrationStatus(integration.status);
}

function healthLabel(integration: IntegrationListItem) {
  if (integration.status === "ERROR" || integration.lastError) return "Error";
  if (!integration.enabled && integration.status === "CONNECTED") return "Degraded";
  if (integration.status === "CONNECTED") return "Healthy";
  if (integration.status === "SYNCING") return "Syncing";
  if (integration.status === "DISABLED") return "Degraded";
  return "Disconnected";
}

export function IntegrationList({
  integrations,
}: {
  integrations: IntegrationListItem[];
}) {
  const connected = integrations.filter((i) => i.status === "CONNECTED" && i.enabled).length;
  const errors = integrations.filter((i) => i.status === "ERROR").length;
  const syncing = integrations.filter((i) => i.status === "SYNCING").length;

  const columns: DataTableColumn<IntegrationListItem>[] = [
    {
      id: "name",
      header: "System",
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-[var(--muted)]">{r.provider}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      sortValue: (r) => r.category,
      cell: (r) => <Badge tone="neutral">{statusLabel(r.category)}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => (
        <StatusBadge status={mapIntegrationStatus(r.status)}>
          {statusLabel(r.status)}
        </StatusBadge>
      ),
    },
    {
      id: "connection",
      header: "Connection",
      sortable: true,
      sortValue: (r) => r.externalAccount ?? r.status,
      cell: (r) => (
        <span className="text-[var(--text-secondary)]">{connectionState(r)}</span>
      ),
    },
    {
      id: "lastSync",
      header: "Last sync",
      sortable: true,
      sortValue: (r) => (r.lastSyncAt ? new Date(r.lastSyncAt).getTime() : 0),
      cell: (r) => (
        <span className="whitespace-nowrap text-[var(--text-secondary)]">
          {formatSyncTime(r.lastSyncAt)}
        </span>
      ),
    },
    {
      id: "error",
      header: "Error",
      sortable: true,
      sortValue: (r) => (r.lastError ? 1 : 0),
      cell: (r) =>
        r.lastError ? (
          <span className="line-clamp-2 max-w-[220px] text-[var(--danger)]" title={r.lastError}>
            {r.lastError}
          </span>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    {
      id: "health",
      header: "Health",
      sortable: true,
      sortValue: (r) => healthLabel(r),
      cell: (r) => (
        <StatusBadge status={healthStatus(r)}>{healthLabel(r)}</StatusBadge>
      ),
    },
    {
      id: "action",
      header: "Action",
      sortable: false,
      cell: (r) => (
        <Link
          href={`/integrations/${r.id}`}
          className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Manage →
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <ModuleCard
        title="Connected systems"
        description="Booking, calendar, messaging, and storage integrations. Connect, sync, and enable from each system detail."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{integrations.length} systems</Badge>
            <Badge tone="success">{connected} connected</Badge>
            {syncing ? <Badge tone="info">{syncing} syncing</Badge> : null}
            {errors ? <Badge tone="danger">{errors} with errors</Badge> : null}
          </div>
        }
      >
        <SortableDataTable
          columns={columns}
          rows={integrations}
          initialSortKey="category"
          initialSortDir="asc"
          onRowHref={(r) => `/integrations/${r.id}`}
          emptyTitle="No integrations"
          emptyDescription="Integration catalog entries appear when the company workspace is ready."
          mobileCard={(r) => (
            <Link
              href={`/integrations/${r.id}`}
              className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {statusLabel(r.category)} · Last sync {formatSyncTime(r.lastSyncAt)}
                  </p>
                  {r.lastError ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--danger)]">{r.lastError}</p>
                  ) : null}
                </div>
                <StatusBadge status={mapIntegrationStatus(r.status)}>
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
