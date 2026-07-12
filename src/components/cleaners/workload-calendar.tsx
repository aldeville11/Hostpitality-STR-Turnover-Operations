import Link from "next/link";
import { Badge } from "@/components/ui";
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Workload by date
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Next 7 days of assigned turnover windows.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => (
          <div
            key={day.date}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-semibold text-[var(--ink)]">{day.label}</p>
              <Badge tone={day.jobs.length ? "accent" : "neutral"}>{day.jobs.length}</Badge>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${(day.jobs.length / max) * 100}%` }}
              />
            </div>
            {day.jobs.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">Gap</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {day.jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/turnovers/${job.id}`}
                      className="block text-xs hover:text-[var(--accent)]"
                    >
                      <span className="font-medium">{job.propertyName}</span>
                      <span className="block text-[var(--muted)]">
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
    </section>
  );
}
