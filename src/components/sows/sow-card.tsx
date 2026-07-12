import Link from "next/link";
import { Badge } from "@/components/ui";
import { STATUS_LABELS, type SowStatus } from "@/lib/sows";
import { formatDateTime } from "@/lib/utils";
import { unitTypeLabel } from "@/lib/properties";

type SowCardProps = {
  sow: {
    id: string;
    name: string;
    description: string | null;
    version: number;
    status: string;
    unitType: string | null;
    useCase: string | null;
    propertyGroup: string | null;
    slaMinutes: number;
    updatedAt: Date | string;
    scopeCount: number;
    addOnCount: number;
    isActiveTemplate: boolean;
    properties: { id: string; name: string; unitCode: string }[];
    _count: { versions: number; turnovers: number };
  };
};

function statusTone(status: string): "success" | "warning" | "neutral" | "info" | "accent" {
  if (status === "ACTIVE") return "success";
  if (status === "APPROVED") return "accent";
  if (status === "PENDING_REVIEW") return "info";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function SowCard({ sow }: SowCardProps) {
  const status = sow.status as SowStatus;
  const label = STATUS_LABELS[status] ?? sow.status;

  return (
    <Link
      href={`/sows/${sow.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {sow.name}
            </p>
            {sow.isActiveTemplate ? <Badge tone="accent">Active template</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {sow.description || sow.useCase || "No description"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            v{sow.version} · {sow.scopeCount} scope items · {sow.addOnCount} add-ons ·{" "}
            {sow.slaMinutes}m SLA · Updated {formatDateTime(sow.updatedAt)}
            {sow.unitType ? ` · ${unitTypeLabel(sow.unitType)}` : ""}
            {sow.propertyGroup ? ` · ${sow.propertyGroup}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {sow.useCase ? <Badge tone="info">{sow.useCase}</Badge> : null}
            {sow.properties.length === 0 ? (
              <Badge tone="neutral">No properties linked</Badge>
            ) : (
              sow.properties.slice(0, 3).map((p) => (
                <Badge key={p.id} tone="neutral">
                  {p.name} ({p.unitCode})
                </Badge>
              ))
            )}
            {sow.properties.length > 3 ? (
              <Badge tone="neutral">+{sow.properties.length - 3} more</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={statusTone(sow.status)}>{label}</Badge>
          <p className="text-xs text-[var(--muted)]">
            {sow._count.versions} version{sow._count.versions === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
