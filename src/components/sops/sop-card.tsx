import Link from "next/link";
import { Badge } from "@/components/ui";
import { STATUS_LABELS, type SopStatus } from "@/lib/sops";
import { formatDateTime } from "@/lib/utils";
import { unitTypeLabel } from "@/lib/properties";

type SopCardProps = {
  sop: {
    id: string;
    name: string;
    description: string | null;
    version: number;
    status: string;
    unitType: string | null;
    updatedAt: Date | string;
    publishedAt: Date | string | null;
    stepCount: number;
    sectionCount: number;
    isActivePublished: boolean;
    properties: { id: string; name: string; unitCode: string }[];
    _count: { versions: number; turnovers: number };
  };
};

function statusTone(status: string): "success" | "warning" | "neutral" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function SopCard({ sop }: SopCardProps) {
  const status = sop.status as SopStatus;
  const label = STATUS_LABELS[status] ?? sop.status;

  return (
    <Link
      href={`/sops/${sop.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {sop.name}
            </p>
            {sop.isActivePublished ? <Badge tone="accent">Active</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {sop.description || "No description"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            v{sop.version} · {sop.sectionCount} sections · {sop.stepCount} steps · Updated{" "}
            {formatDateTime(sop.updatedAt)}
            {sop.unitType ? ` · ${unitTypeLabel(sop.unitType)}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {sop.properties.length === 0 ? (
              <Badge tone="neutral">No properties linked</Badge>
            ) : (
              sop.properties.slice(0, 4).map((p) => (
                <Badge key={p.id} tone="info">
                  {p.name} ({p.unitCode})
                </Badge>
              ))
            )}
            {sop.properties.length > 4 ? (
              <Badge tone="neutral">+{sop.properties.length - 4} more</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={statusTone(sop.status)}>{label}</Badge>
          <p className="text-xs text-[var(--muted)]">
            {sop._count.versions} version{sop._count.versions === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
