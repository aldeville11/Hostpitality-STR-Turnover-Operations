import Link from "next/link";
import {
  REPORT_VIEW_LABELS,
  type ReportFilters,
  type ReportView,
} from "@/lib/reports";

const VIEWS: ReportView[] = ["overview", "property", "qa", "cleaners"];

export function ReportFiltersBar({
  view,
  filters,
  properties,
  cleaners,
  statuses,
}: {
  view: ReportView;
  filters: ReportFilters;
  properties: Array<{ id: string; name: string; unitCode: string }>;
  cleaners: Array<{ id: string; name: string }>;
  statuses?: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => {
          const href = v === "overview" ? "/reports" : `/reports/${v}`;
          const active = v === view;
          return (
            <Link
              key={v}
              href={buildHref(href, filters)}
              className={
                active
                  ? "rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              }
            >
              {REPORT_VIEW_LABELS[v]}
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <label className="text-sm">
          <span className="sr-only">From</span>
          <input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="sr-only">To</span>
          <input
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <select
          name="propertyId"
          defaultValue={filters.propertyId ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.unitCode})
            </option>
          ))}
        </select>
        <select
          name="cleanerId"
          defaultValue={filters.cleanerId ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All cleaners</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {statuses ? (
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          Apply filters
        </button>
        <Link
          href={view === "overview" ? "/reports" : `/reports/${view}`}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>
    </div>
  );
}

function buildHref(base: string, filters: ReportFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.propertyId) params.set("propertyId", filters.propertyId);
  if (filters.cleanerId) params.set("cleanerId", filters.cleanerId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
