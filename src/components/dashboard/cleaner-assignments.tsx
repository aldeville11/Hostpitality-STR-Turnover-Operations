import Link from "next/link";
import { EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
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
    <ModuleCard
      title="Cleaner assignment coverage"
      description="Active field workload and today’s unassigned windows."
      actions={
        <Link
          href="/cleaners"
          className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
        >
          Open dispatch
        </Link>
      }
    >
      {cleaners.length === 0 ? (
        <EmptyState
          title="No cleaners on the roster"
          description="Add cleaners during onboarding or from the Cleaners workspace to see assignment coverage here."
          action={
            <Link
              href="/cleaners"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Open cleaners →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {cleaners.map((cleaner) => (
            <div
              key={cleaner.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/cleaners/${cleaner.id}`}
                    className="rounded-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  >
                    {cleaner.name}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">{cleaner.type}</p>
                </div>
                <StatusBadge status={cleaner.activeJobs ? "assigned" : "pending"}>
                  {cleaner.activeJobs} active
                </StatusBadge>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
                role="meter"
                aria-label={`${cleaner.activeJobs} of ${maxLoad} relative load`}
                aria-valuenow={cleaner.activeJobs}
                aria-valuemin={0}
                aria-valuemax={maxLoad}
              >
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(cleaner.activeJobs / maxLoad) * 100}%` }}
                />
              </div>
              {cleaner.jobs.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {cleaner.jobs.slice(0, 3).map((job) => (
                    <li key={job.id}>
                      <Link
                        href={`/turnovers/${job.id}`}
                        className="hover:text-[var(--accent-strong)] hover:underline"
                      >
                        {job.propertyName} · {formatTime(job.windowStart)} ·{" "}
                        {statusLabel(job.status)}
                      </Link>
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
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)]/60 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--warning)]">
              {unassignedToday.length} today’s job{unassignedToday.length === 1 ? "" : "s"}{" "}
              unassigned
            </p>
            <StatusBadge status="unassigned">Coverage gap</StatusBadge>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
            {unassignedToday.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/turnovers/${t.id}`}
                  className="hover:text-[var(--accent-strong)] hover:underline"
                >
                  {t.property.name} · {formatTime(t.windowStart)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ModuleCard>
  );
}
