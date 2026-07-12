import Link from "next/link";
import { Badge } from "@/components/ui";
import type { listTurnovers } from "@/lib/turnovers";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { priorityTone, turnoverStatusTone } from "@/lib/dashboard";

type TurnoverRow = Awaited<ReturnType<typeof listTurnovers>>[number];

export function TurnoverCard({ turnover }: { turnover: TurnoverRow }) {
  const done = turnover.checklistItems.filter((i) => i.completed).length;
  const total = turnover.checklistItems.length;

  return (
    <Link
      href={`/turnovers/${turnover.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {turnover.property.name}{" "}
            <span className="text-[var(--muted)]">· {turnover.property.unitCode}</span>
          </p>
          <p className="text-sm text-[var(--muted)]">
            Due {formatDateTime(turnover.deadlineAt)} · Window {formatDateTime(turnover.windowStart)} –{" "}
            {formatDateTime(turnover.windowEnd)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {turnover.vendor?.name ?? "Unassigned"}
            {turnover.booking
              ? ` · ${turnover.booking.source} checkout ${formatDateTime(turnover.booking.checkOut)}`
              : ""}
            {total ? ` · Checklist ${done}/${total}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={priorityTone(turnover.priority)}>{turnover.priority}</Badge>
          <Badge tone={turnoverStatusTone(turnover.status)}>{statusLabel(turnover.status)}</Badge>
        </div>
      </div>
    </Link>
  );
}
