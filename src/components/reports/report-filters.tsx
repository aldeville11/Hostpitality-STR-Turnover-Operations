import Link from "next/link";
import { Button, Input, Select } from "@/components/ui";
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
      <nav
        className="flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-3"
        aria-label="Report views"
      >
        {VIEWS.map((v) => {
          const href = v === "overview" ? "/reports" : `/reports/${v}`;
          const active = v === view;
          return (
            <Link
              key={v}
              href={buildHref(href, filters)}
              className={
                active
                  ? "rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }
              aria-current={active ? "page" : undefined}
            >
              {REPORT_VIEW_LABELS[v]}
            </Link>
          );
        })}
      </nav>

      <form className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
        <label className="min-w-[9rem] flex-1 text-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            From
          </span>
          <Input type="date" name="from" defaultValue={filters.from ?? ""} />
        </label>
        <label className="min-w-[9rem] flex-1 text-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            To
          </span>
          <Input type="date" name="to" defaultValue={filters.to ?? ""} />
        </label>
        <label className="min-w-[10rem] flex-[1.2] text-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Property
          </span>
          <Select name="propertyId" defaultValue={filters.propertyId ?? ""}>
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unitCode})
              </option>
            ))}
          </Select>
        </label>
        <label className="min-w-[10rem] flex-[1.2] text-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Cleaner
          </span>
          <Select name="cleanerId" defaultValue={filters.cleanerId ?? ""}>
            <option value="">All cleaners</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        {statuses ? (
          <label className="min-w-[10rem] flex-1 text-sm">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              Status
            </span>
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Apply filters</Button>
          <Link
            href={view === "overview" ? "/reports" : `/reports/${view}`}
            className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
          >
            Reset
          </Link>
        </div>
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
