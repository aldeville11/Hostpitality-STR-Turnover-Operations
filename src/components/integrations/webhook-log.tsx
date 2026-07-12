import { Badge } from "@/components/ui";
import { formatSyncTime } from "@/lib/integrations";

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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Sync history
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connection changes and sync runs for troubleshooting.
        </p>
        {syncEvents.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No sync events yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {syncEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={event.status === "FAILED" ? "danger" : "success"}>
                    {event.status}
                  </Badge>
                  <Badge tone="neutral">{event.type}</Badge>
                  <span className="text-xs text-[var(--muted)]">
                    {formatSyncTime(event.startedAt)}
                  </span>
                </div>
                <p className="mt-1 font-medium">{event.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  +{event.recordsCreated} / ~{event.recordsUpdated} / skip {event.recordsSkipped}
                </p>
                {event.error ? (
                  <p className="mt-1 text-xs text-rose-700">{event.error}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Webhook / inbound log
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Normalized external events after they hit Hostpitality.
        </p>
        {webhooks.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No inbound events yet. Run a sync.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {webhooks.map((log) => (
              <li
                key={log.id}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      log.status === "FAILED"
                        ? "danger"
                        : log.status === "IGNORED"
                          ? "warning"
                          : "info"
                    }
                  >
                    {log.status}
                  </Badge>
                  <span className="font-medium">{log.eventType}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatSyncTime(log.createdAt)}
                  </span>
                </div>
                {log.externalId ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">External ID {log.externalId}</p>
                ) : null}
                {log.error ? <p className="mt-1 text-xs text-rose-700">{log.error}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
