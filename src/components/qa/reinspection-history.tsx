import { Badge, DetailSection, EmptyState, StatusBadge } from "@/components/ui";
import { QA_STATUS_LABELS, type QaStatus } from "@/lib/qa";
import { mapQaStatus } from "@/lib/status-map";
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
    <DetailSection
      title="Reinspection history"
      description="Every QA round with inspector, outcome, and timestamps."
    >
      {inspections.length === 0 ? (
        <EmptyState title="No inspections" description="No inspections recorded yet." />
      ) : (
        <ol className="space-y-3">
          {inspections.map((inspection, idx) => (
            <li
              key={inspection.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Round {inspections.length - idx}</Badge>
                <StatusBadge status={mapQaStatus(inspection.status)}>
                  {QA_STATUS_LABELS[inspection.status as QaStatus] ?? inspection.status}
                </StatusBadge>
                {inspection.overrideIncomplete ? (
                  <Badge tone="accent">Override used</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Opened {formatDateTime(inspection.createdAt)}
                {inspection.completedAt
                  ? ` · Closed ${formatDateTime(inspection.completedAt)}`
                  : " · In progress"}
                {inspection.inspectorName ? ` · ${inspection.inspectorName}` : ""}
              </p>
              {inspection.decisionNote ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {inspection.decisionNote}
                </p>
              ) : null}
              {inspection.events.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--text-secondary)]">
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
    </DetailSection>
  );
}
