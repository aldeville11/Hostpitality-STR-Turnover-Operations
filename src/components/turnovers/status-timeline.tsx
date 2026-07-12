import { Badge } from "@/components/ui";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { turnoverStatusTone } from "@/lib/dashboard";

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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Status history
        </h2>
        <Badge tone={turnoverStatusTone(currentStatus)}>{statusLabel(currentStatus)}</Badge>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No status transitions recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event, idx) => (
            <li key={event.id} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              {idx < events.length - 1 ? (
                <span className="absolute left-[4px] top-4 h-[calc(100%-4px)] w-px bg-[var(--border)]" />
              ) : null}
              <p className="text-sm font-medium">
                {event.fromStatus ? statusLabel(event.fromStatus) : "Created"} →{" "}
                {statusLabel(event.toStatus)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {formatDateTime(event.createdAt)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </p>
              {event.note ? <p className="mt-1 text-xs text-[var(--muted)]">{event.note}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
