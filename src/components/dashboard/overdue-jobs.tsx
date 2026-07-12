import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatDateTime, statusLabel } from "@/lib/utils";

export function OverdueJobs({ jobs }: { jobs: DashboardData["overdue"] }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Overdue jobs
        </h2>
        <Badge tone={jobs.length ? "danger" : "success"}>{jobs.length}</Badge>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No missed deadlines. All active turnovers are still inside their SLA window.
        </p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {job.property.name} · {job.property.unitCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Deadline {formatDateTime(job.deadlineAt)} ·{" "}
                    {job.vendor?.name ?? "No cleaner assigned"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="danger">{statusLabel(job.status)}</Badge>
                  <Badge tone={job.isEscalated ? "warning" : "neutral"}>
                    {job.isEscalated ? "Escalated" : "Not escalated"}
                  </Badge>
                </div>
              </div>
              {job.issues.length > 0 ? (
                <p className="mt-2 text-xs text-rose-800">
                  Risk: {job.issues.length} open issue(s) tied to this turnover.
                </p>
              ) : (
                <p className="mt-2 text-xs text-rose-800">
                  Risk: guest arrival may be blocked if this window slips further.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
