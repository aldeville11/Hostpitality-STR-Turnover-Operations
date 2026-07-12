import Link from "next/link";
import { Badge, DetailSection } from "@/components/ui";
import { formatTime, statusLabel } from "@/lib/utils";

type Day = {
  date: string;
  label: string;
  jobs: Array<{
    id: string;
    propertyName: string;
    unitCode: string;
    status: string;
    windowStart: Date | string;
    windowEnd: Date | string;
    deadlineAt: Date | string;
    priority: string;
  }>;
};

export function WorkloadCalendar({ days }: { days: Day[] }) {
  const max = Math.max(1, ...days.map((d) => d.jobs.length));

  return (
    <DetailSection
      title="Workload by date"
      description="Next 7 days of assigned turnover windows."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => (
          <div
            key={day.date}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{day.label}</p>
              <Badge tone={day.jobs.length ? "accent" : "neutral"}>{day.jobs.length}</Badge>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${(day.jobs.length / max) * 100}%` }}
              />
            </div>
            {day.jobs.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">Gap</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {day.jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/turnovers/${job.id}`}
                      className="block text-xs hover:text-[var(--accent)]"
                    >
                      <span className="font-medium text-[var(--text-primary)]">
                        {job.propertyName}
                      </span>
                      <span className="block text-[var(--text-secondary)]">
                        {formatTime(job.windowStart)} · {statusLabel(job.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </DetailSection>
  );
}
