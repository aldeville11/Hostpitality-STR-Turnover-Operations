import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatTime, statusLabel } from "@/lib/utils";

export function CleanerAssignments({
  assignments,
}: {
  assignments: DashboardData["assignments"];
}) {
  const { cleaners, unassignedToday } = assignments;
  const maxLoad = Math.max(1, ...cleaners.map((c) => c.activeJobs));

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Cleaner assignments
        </h2>
        <Badge tone="info">{cleaners.length} on roster</Badge>
      </div>

      {cleaners.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No cleaners on the roster yet. Add vendors during onboarding or settings to see workload
          here.
        </p>
      ) : (
        <div className="space-y-3">
          {cleaners.map((cleaner) => (
            <div key={cleaner.id} className="rounded-xl border border-[var(--border)] px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{cleaner.name}</p>
                  <p className="text-xs text-[var(--muted)]">{cleaner.type}</p>
                </div>
                <Badge tone={cleaner.activeJobs ? "accent" : "neutral"}>
                  {cleaner.activeJobs} active
                </Badge>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(cleaner.activeJobs / maxLoad) * 100}%` }}
                />
              </div>
              {cleaner.jobs.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {cleaner.jobs.slice(0, 3).map((job) => (
                    <li key={job.id}>
                      {job.propertyName} · {formatTime(job.windowStart)} ·{" "}
                      {statusLabel(job.status)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-[var(--muted)]">No open assignments</p>
              )}
            </div>
          ))}
        </div>
      )}

      {unassignedToday.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {unassignedToday.length} today’s job(s) unassigned
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-amber-900/80">
            {unassignedToday.map((t) => (
              <li key={t.id}>
                {t.property.name} · {formatTime(t.windowStart)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
