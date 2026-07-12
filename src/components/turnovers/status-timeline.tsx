import { DetailSection, EmptyState, StatusBadge } from "@/components/ui";
import { mapTurnoverStatus } from "@/lib/status-map";
import { formatDateTime, statusLabel } from "@/lib/utils";

type StatusEvent = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorName: string | null;
  createdAt: Date | string;
};

export function StatusTimeline({
  events,
  currentStatus,
}: {
  events: StatusEvent[];
  currentStatus: string;
}) {
  return (
    <DetailSection
      title="Status history"
      actions={
        <StatusBadge status={mapTurnoverStatus(currentStatus)}>
          {statusLabel(currentStatus)}
        </StatusBadge>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          title="No transitions"
          description="No status transitions recorded yet."
        />
      ) : (
        <ol className="space-y-3">
          {events.map((event, idx) => (
            <li key={event.id} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              {idx < events.length - 1 ? (
                <span className="absolute left-[4px] top-4 h-[calc(100%-4px)] w-px bg-[var(--border)]" />
              ) : null}
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {event.fromStatus ? statusLabel(event.fromStatus) : "Created"} →{" "}
                {statusLabel(event.toStatus)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatDateTime(event.createdAt)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </p>
              {event.note ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </DetailSection>
  );
}
