import Link from "next/link";
import { Badge, DetailSection, EmptyState } from "@/components/ui";
import { parseSowDocument, STATUS_LABELS, type SowStatus } from "@/lib/sows";

type Sow = {
  id: string;
  name: string;
  description: string | null;
  standardScope: string;
  addOnsJson: string;
  contentJson?: string | null;
  slaMinutes: number;
  completionDeadlineMinutes?: number | null;
  version?: number;
  status?: string;
  useCase?: string | null;
} | null;

export function LinkedSows({ sow }: { sow: Sow }) {
  const doc = parseSowDocument(sow?.contentJson, {
    standardScope: sow?.standardScope,
    addOnsJson: sow?.addOnsJson,
  });
  const status = (sow?.status as SowStatus | undefined) ?? "DRAFT";

  return (
    <DetailSection title="Linked SOW template">
      {!sow ? (
        <EmptyState
          title="No SOW template linked"
          description="Define scope and SLA before generating turnovers."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-[var(--text-primary)]">{sow.name}</p>
            {sow.version ? <Badge>v{sow.version}</Badge> : null}
            <Badge tone="info">{sow.slaMinutes}m SLA</Badge>
            <Badge
              tone={
                status === "ACTIVE"
                  ? "success"
                  : status === "APPROVED"
                    ? "accent"
                    : status === "PENDING_REVIEW"
                      ? "info"
                      : "warning"
              }
            >
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
          {sow.useCase ? (
            <p className="text-xs text-[var(--text-secondary)]">Use case: {sow.useCase}</p>
          ) : null}
          <p className="text-sm text-[var(--text-secondary)]">
            {sow.standardScope || doc.scopeItems.map((i) => i.title).join(", ")}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {doc.scopeItems.length} scope · {doc.addOns.length} add-ons ·{" "}
            {doc.photoRequirements.length} photo reqs
          </p>
          {doc.addOns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {doc.addOns.slice(0, 6).map((a) => (
                <Badge key={a.id} tone={a.requiresApproval ? "warning" : "neutral"}>
                  {a.name}
                </Badge>
              ))}
            </div>
          ) : null}
          <Link
            href={`/sows/${sow.id}`}
            className="inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Open SOW editor
          </Link>
        </div>
      )}
    </DetailSection>
  );
}