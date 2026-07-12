import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui";
import {
  formatSyncTime,
  type IntegrationListItem,
} from "@/lib/integrations";
import { mapIntegrationStatus } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

/** Compact integration row — prefer IntegrationList table for the hub. */
export function IntegrationCard({ integration }: { integration: IntegrationListItem }) {
  const latest = integration.syncEvents[0];

  return (
    <Link
      href={`/integrations/${integration.id}`}
      className="block rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-base font-semibold">
              {integration.name}
            </p>
            <Badge tone="neutral">{statusLabel(integration.category)}</Badge>
            {!integration.enabled ? (
              <StatusBadge status="degraded">Disabled</StatusBadge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {integration.catalog?.description ?? "External service connection"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Account {integration.externalAccount ?? "—"}
            {" · "}
            Last sync {formatSyncTime(integration.lastSyncAt)}
            {latest ? ` · ${latest.summary}` : ""}
          </p>
          {integration.lastError ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{integration.lastError}</p>
          ) : null}
        </div>
        <StatusBadge status={mapIntegrationStatus(integration.status)}>
          {statusLabel(integration.status)}
        </StatusBadge>
      </div>
    </Link>
  );
}
