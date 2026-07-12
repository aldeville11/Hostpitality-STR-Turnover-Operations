import type { PerformanceSnapshot } from "@/lib/launch";

export function PerformancePanel({ snapshot }: { snapshot: PerformanceSnapshot }) {
  const rows = [
    { label: "Properties", value: snapshot.volumes.properties },
    { label: "Turnovers", value: snapshot.volumes.turnovers },
    { label: "Issues", value: snapshot.volumes.issues },
    { label: "QA inspections", value: snapshot.volumes.inspections },
    { label: "Users", value: snapshot.volumes.users },
    { label: "Pending jobs", value: snapshot.jobs.pending },
    { label: "Failed jobs", value: snapshot.jobs.failed },
    { label: "Failed syncs (7d)", value: snapshot.failedSyncs7d },
  ];

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
          Performance snapshot
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Volume and query-budget signals for list pressure. Prefer filters and scoped queries as
          counts grow.
        </p>
      </div>
      <p className="text-sm text-[var(--ink)]">
        Diagnostics query budget:{" "}
        <span className="font-semibold">{snapshot.listQueryMs}ms</span>
      </p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-4 py-3"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {row.label}
            </dt>
            <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="space-y-1.5 text-xs text-[var(--muted)]">
        {snapshot.recommendations.map((rec) => (
          <li key={rec}>· {rec}</li>
        ))}
      </ul>
    </section>
  );
}
