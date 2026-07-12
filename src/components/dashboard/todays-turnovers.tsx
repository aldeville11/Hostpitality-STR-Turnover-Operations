import Link from "next/link";
import { Badge, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatTime, statusLabel } from "@/lib/utils";
import { mapTurnoverStatus } from "@/lib/status-map";

export function TodaysTurnovers({
  turnovers,
}: {
  turnovers: DashboardData["todaysTurnovers"];
}) {
  return (
    <ModuleCard
      title="Today’s turnovers"
      description="Scheduled cleaning windows for the current operating day."
      actions={
        <>
          <Badge tone="accent">{turnovers.length}</Badge>
          <Link
            href="/turnovers"
            className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
          >
            View all
          </Link>
        </>
      }
    >
      {turnovers.length === 0 ? (
        <EmptyState
          title="No turnovers today"
          description="No turnovers scheduled for today. Sync a calendar or activate a new job to populate this queue."
          action={
            <Link
              href="/turnovers"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Open turnovers →
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {turnovers.map((t) => (
            <li key={t.id}>
              <Link
                href={`/turnovers/${t.id}`}
                className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-[var(--surface-raised)]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    {t.property.name}{" "}
                    <span className="text-[var(--muted)]">· {t.property.unitCode}</span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatTime(t.windowStart)} – {formatTime(t.windowEnd)}
                    {" · "}
                    {t.vendor?.name ?? "Unassigned"}
                    {t.issues.length ? ` · ${t.issues.length} open issue(s)` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{t.priority}</Badge>
                  <StatusBadge status={mapTurnoverStatus(t.status)}>
                    {statusLabel(t.status)}
                  </StatusBadge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
