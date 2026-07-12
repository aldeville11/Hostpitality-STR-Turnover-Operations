import Link from "next/link";
import { Badge, DetailSection, EmptyState } from "@/components/ui";
import { countSteps, parseSopDocument, STATUS_LABELS, type SopStatus } from "@/lib/sops";

type Sop = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  contentJson: string;
  status?: string;
  safetyNotes?: string | null;
} | null;

export function LinkedSops({ sop }: { sop: Sop }) {
  const doc = parseSopDocument(sop?.contentJson, sop?.safetyNotes ?? "");
  const steps = countSteps(doc);
  const status = (sop?.status as SopStatus | undefined) ?? "DRAFT";

  return (
    <DetailSection title="Linked SOP">
      {!sop ? (
        <EmptyState
          title="No SOP linked"
          description="Attach a playbook in settings or from the SOPs page so cleaners know the room-by-room process."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[var(--text-primary)]">{sop.name}</p>
            <Badge>v{sop.version}</Badge>
            <Badge
              tone={
                status === "PUBLISHED" ? "success" : status === "ARCHIVED" ? "neutral" : "warning"
              }
            >
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
          {sop.description ? (
            <p className="text-sm text-[var(--text-secondary)]">{sop.description}</p>
          ) : null}
          <p className="text-xs text-[var(--text-secondary)]">
            {doc.sections.length} sections · {steps} steps
          </p>
          {doc.sections.length > 0 ? (
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              {doc.sections.slice(0, 5).map((section) => (
                <li key={section.id}>
                  {section.title}
                  {section.room ? ` · ${section.room}` : ""} ({section.steps.length})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">SOP has no checklist steps yet.</p>
          )}
          <Link
            href={`/sops/${sop.id}`}
            className="inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Open SOP editor
          </Link>
        </div>
      )}
    </DetailSection>
  );
}
