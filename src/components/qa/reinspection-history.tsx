import { Badge } from "@/components/ui";
import { QA_STATUS_LABELS, qaStatusTone, type QaStatus } from "@/lib/qa";
import { formatDateTime } from "@/lib/utils";

type Inspection = {
  id: string;
  status: string;
  inspectorName: string | null;
  decisionNote: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  overrideIncomplete: boolean;
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    actorName: string | null;
    createdAt: Date | string;
  }>;
};

export function ReinspectionHistory({ inspections }: { inspections: Inspection[] }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Reinspection history
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Every QA round with inspector, outcome, and timestamps.
      </p>

      {inspections.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No inspections recorded yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {inspections.map((inspection, idx) => (
            <li
              key={inspection.id}
              className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Round {inspections.length - idx}</Badge>
                <Badge tone={qaStatusTone(inspection.status)}>
                  {QA_STATUS_LABELS[inspection.status as QaStatus] ?? inspection.status}
                </Badge>
                {inspection.overrideIncomplete ? (
                  <Badge tone="accent">Override used</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Opened {formatDateTime(inspection.createdAt)}
                {inspection.completedAt
                  ? ` · Closed ${formatDateTime(inspection.completedAt)}`
                  : " · In progress"}
                {inspection.inspectorName ? ` · ${inspection.inspectorName}` : ""}
              </p>
              {inspection.decisionNote ? (
                <p className="mt-1 text-xs text-[var(--muted)]">{inspection.decisionNote}</p>
              ) : null}
              {inspection.events.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
                  {inspection.events.map((event) => (
                    <li key={event.id}>
                      {event.fromStatus ?? "—"} → {event.toStatus}
                      {event.note ? ` · ${event.note}` : ""}
                      {event.actorName ? ` · ${event.actorName}` : ""} ·{" "}
                      {formatDateTime(event.createdAt)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
