import Link from "next/link";
import { Badge } from "@/components/ui";
import { TurnoverCard } from "@/components/turnovers/turnover-card";
import type { listTurnovers } from "@/lib/turnovers";
import { TURNOVER_STATUSES } from "@/lib/turnovers";
import { statusLabel } from "@/lib/utils";

type TurnoverRow = Awaited<ReturnType<typeof listTurnovers>>[number];

export function TurnoverList({
  turnovers,
  filters,
  properties,
}: {
  turnovers: TurnoverRow[];
  filters: { status?: string; propertyId?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search property or cleaner"
          className="min-w-[180px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {TURNOVER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
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
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <Link
          href="/turnovers"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{turnovers.length} shown</Badge>
      </div>

      {turnovers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            No turnovers match
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Sync calendars or create a turnover from a property booking window to start the cleaning
            workflow.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {turnovers.map((turnover) => (
            <TurnoverCard key={turnover.id} turnover={turnover} />
          ))}
        </div>
      )}
    </div>
  );
}
