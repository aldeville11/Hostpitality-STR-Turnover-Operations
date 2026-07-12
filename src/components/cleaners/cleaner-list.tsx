import Link from "next/link";
import { Badge } from "@/components/ui";
import { CleanerCard } from "@/components/cleaners/cleaner-card";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_STATUSES,
  TYPE_LABELS,
  VENDOR_TYPES,
  type listCleaners,
} from "@/lib/cleaners";

type CleanerRow = Awaited<ReturnType<typeof listCleaners>>[number];

export function CleanerList({
  cleaners,
  filters,
  unassignedCount,
}: {
  cleaners: CleanerRow[];
  filters: { type?: string; availability?: string; q?: string };
  unassignedCount: number;
}) {
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search cleaners"
          className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="type"
          defaultValue={filters.type ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {VENDOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          name="availability"
          defaultValue={filters.availability ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All availability</option>
          {AVAILABILITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {AVAILABILITY_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <Link
          href="/cleaners"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{cleaners.length} on roster</Badge>
        {unassignedCount > 0 ? (
          <Badge tone="warning">{unassignedCount} unassigned turnovers</Badge>
        ) : (
          <Badge tone="success">No unassigned gaps this week</Badge>
        )}
      </div>

      {cleaners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            No cleaners yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Add cleaners and vendors during onboarding, then use this board to assign coverage and
            watch workload.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cleaners.map((cleaner) => (
            <CleanerCard key={cleaner.id} cleaner={cleaner} />
          ))}
        </div>
      )}
    </div>
  );
}
