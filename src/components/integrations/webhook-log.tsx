import { EmptyState, DetailSection, StatusBadge } from "@/components/ui";
import { formatSyncTime } from "@/lib/integrations";
import { mapSyncEventStatus } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

type WebhookRow = {
  id: string;
  eventType: string;
  externalId: string | null;
  status: string;
  error: string | null;
  createdAt: Date | string;
  processedAt: Date | string | null;
};

type SyncRow = {
  id: string;
  type: string;
  status: string;
  summary: string;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  error: string | null;
  startedAt: Date | string;
  completedAt: Date | string | null;
};

export function WebhookLog({
  webhooks,
  syncEvents,
}: {
  webhooks: WebhookRow[];
  syncEvents: SyncRow[];
}) {
  return (
    <div className="space-y-6">
      <DetailSection
        title="Sync history"
        description="Connection changes and sync runs for troubleshooting."
      >
        {syncEvents.length === 0 ? (
          <EmptyState
            title="No sync events yet"
            description="Connect the integration and run a sync to populate history."
          />
        ) : (
          <ul className="space-y-2">
            {syncEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={mapSyncEventStatus(event.status)}>
                    {statusLabel(event.status)}
                  </StatusBadge>
                  <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                    {event.type}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatSyncTime(event.startedAt)}
                  </span>
                </div>
                <p className="mt-1 font-medium">{event.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  +{event.recordsCreated} / ~{event.recordsUpdated} / skip {event.recordsSkipped}
                </p>
                {event.error ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{event.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection
        title="Webhook / inbound log"
        description="Normalized external events after they hit Hostpitality."
      >
        {webhooks.length === 0 ? (
          <EmptyState
            title="No inbound events yet"
            description="Run a sync to receive and normalize external events."
          />
        ) : (
          <ul className="space-y-2">
            {webhooks.map((log) => (
              <li
                key={log.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={mapSyncEventStatus(log.status)}>
                    {statusLabel(log.status)}
                  </StatusBadge>
                  <span className="font-medium">{log.eventType}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatSyncTime(log.createdAt)}
                  </span>
                </div>
                {log.externalId ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">External ID {log.externalId}</p>
                ) : null}
                {log.error ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{log.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
