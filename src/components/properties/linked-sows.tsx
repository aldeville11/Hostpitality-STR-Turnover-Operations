import Link from "next/link";
import { Badge } from "@/components/ui";
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Linked SOW template
      </h2>
      {!sow ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          No SOW template linked. Define scope and SLA before generating turnovers.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{sow.name}</p>
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
            <p className="text-xs text-[var(--muted)]">Use case: {sow.useCase}</p>
          ) : null}
          <p className="text-sm text-[var(--muted)]">
            {sow.standardScope || doc.scopeItems.map((i) => i.title).join(", ")}
          </p>
          <p className="text-xs text-[var(--muted)]">
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
    </section>
  );
}
