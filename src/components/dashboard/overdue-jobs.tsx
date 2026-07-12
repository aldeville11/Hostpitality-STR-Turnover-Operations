import Link from "next/link";
import { EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { mapTurnoverStatus } from "@/lib/status-map";

export function OverdueJobs({ jobs }: { jobs: DashboardData["overdue"] }) {
  return (
    <ModuleCard
      title="Overdue jobs"
      description="Turnovers past deadline or marked overdue — highest operational risk."
      actions={
        <StatusBadge status={jobs.length ? "failed" : "healthy"}>
          {jobs.length ? `${jobs.length} at risk` : "Clear"}
        </StatusBadge>
      }
    >
      {jobs.length === 0 ? (
        <EmptyState
          title="No overdue jobs"
          description="All active turnovers are still inside their SLA window."
        />
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/turnovers/${job.id}`}
                className="block rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)]/50 px-3 py-3 transition hover:border-[var(--danger)]/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {job.property.name} · {job.property.unitCode}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Deadline {formatDateTime(job.deadlineAt)} ·{" "}
                      {job.vendor?.name ?? "No cleaner assigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={mapTurnoverStatus(job.status)}>
                      {statusLabel(job.status)}
                    </StatusBadge>
                    <StatusBadge status={job.isEscalated ? "at_risk" : "pending"}>
                      {job.isEscalated ? "Escalated" : "Not escalated"}
                    </StatusBadge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--danger)]">
                  {job.issues.length > 0
                    ? `Risk: ${job.issues.length} open issue(s) tied to this turnover.`
                    : "Risk: guest arrival may be blocked if this window slips further."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
