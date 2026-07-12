import {
  formatIssueDateTime,
  type IssueCommentDto,
  type IssueEventDto,
} from "@/lib/issues";
import { Badge, DetailSection, EmptyState } from "@/components/ui";

function eventLabel(type: string) {
  if (type === "STATUS") return "Status";
  if (type === "ASSIGNMENT") return "Assignment";
  if (type === "ESCALATION") return "Escalation";
  if (type === "COMMENT") return "Comment";
  return type;
}

export function IssueTimeline({
  events,
  comments,
}: {
  events: IssueEventDto[];
  comments: IssueCommentDto[];
}) {
  const items = [
    ...events.map((e) => ({
      id: `e-${e.id}`,
      kind: "event" as const,
      at: e.createdAt,
      type: e.type,
      summary: e.note || `${e.fromValue ?? "—"} → ${e.toValue ?? "—"}`,
      actorName: e.actorName,
      fromValue: e.fromValue,
      toValue: e.toValue,
      showTransition: Boolean(e.fromValue || e.toValue) && Boolean(e.note),
    })),
    ...comments.map((c) => ({
      id: `c-${c.id}`,
      kind: "comment" as const,
      at: c.createdAt,
      type: c.visibility,
      summary: c.body,
      actorName: c.actorName,
      fromValue: null as string | null,
      toValue: null as string | null,
      showTransition: false,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <DetailSection
      title="History & comments"
      description="Status transitions, assignments, escalations, and notes."
    >
      {items.length === 0 ? (
        <EmptyState title="No history" description="No history yet." />
      ) : (
        <ol className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="relative border-l-2 border-[var(--border)] pl-4">
              <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.kind === "comment" ? "neutral" : "info"}>
                  {item.kind === "comment"
                    ? item.type === "EXTERNAL"
                      ? "External update"
                      : "Internal note"
                    : eventLabel(item.type)}
                </Badge>
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatIssueDateTime(item.at)}
                </span>
                {item.actorName ? (
                  <span className="text-xs text-[var(--text-secondary)]">
                    · {item.actorName}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {item.summary}
              </p>
              {item.showTransition ? (
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {item.fromValue ?? "—"} → {item.toValue ?? "—"}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </DetailSection>
  );
}
