import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { priorityTone, turnoverStatusTone } from "@/lib/dashboard";
import { formatTime, statusLabel } from "@/lib/utils";

export function TodaysTurnovers({
  turnovers,
}: {
  turnovers: DashboardData["todaysTurnovers"];
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Today’s turnovers
        </h2>
        <Badge tone="accent">{turnovers.length}</Badge>
      </div>

      {turnovers.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No turnovers scheduled for today. Sync a calendar or activate a new job to populate this
          queue.
        </p>
      ) : (
        <div className="space-y-2">
          {turnovers.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
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
                <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                <Badge tone={turnoverStatusTone(t.status)}>{statusLabel(t.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
