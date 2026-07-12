import Link from "next/link";
import { Badge } from "@/components/ui";
import { QA_STATUS_LABELS, qaStatusTone, type QaStatus } from "@/lib/qa";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { priorityTone } from "@/lib/dashboard";

type QaCardProps = {
  item: {
    id: string;
    status: string;
    priority: string;
    deadlineAt: Date | string;
    windowStart: Date | string;
    photosUploaded: number;
    photosRequired: number;
    qaStatus: string;
    checklistProgress: { done: number; total: number };
    property: { name: string; unitCode: string; city: string };
    vendor: { name: string } | null;
    latestQa: {
      inspectorName: string | null;
      status: string;
    } | null;
  };
};

export function QaCard({ item }: QaCardProps) {
  const qaStatus = item.qaStatus as QaStatus;

  return (
    <Link
      href={`/qa/${item.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {item.property.name}{" "}
            <span className="text-[var(--muted)]">· {item.property.unitCode}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {item.vendor?.name ?? "Unassigned cleaner"} · Due {formatDateTime(item.deadlineAt)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Checklist {item.checklistProgress.done}/{item.checklistProgress.total} · Photos{" "}
            {item.photosUploaded}/{item.photosRequired}
            {item.latestQa?.inspectorName
              ? ` · Inspector ${item.latestQa.inspectorName}`
              : " · Unclaimed"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={qaStatusTone(qaStatus)}>
            {QA_STATUS_LABELS[qaStatus] ?? statusLabel(item.qaStatus)}
          </Badge>
          <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
          <Badge tone="neutral">{statusLabel(item.status)}</Badge>
        </div>
      </div>
    </Link>
  );
}
