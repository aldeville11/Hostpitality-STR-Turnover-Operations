import Link from "next/link";
import { Badge } from "@/components/ui";
import { SowCard } from "@/components/sows/sow-card";
import { SOW_STATUSES, STATUS_LABELS, type listSows } from "@/lib/sows";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";

type SowRow = Awaited<ReturnType<typeof listSows>>[number];

export function SowList({
  sows,
  filters,
  properties,
}: {
  sows: SowRow[];
  filters: { status?: string; propertyId?: string; unitType?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search templates"
          className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {SOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="unitType"
          defaultValue={filters.unitType ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All unit types</option>
          {UNIT_TYPES.map((t) => (
            <option key={t} value={t}>
              {unitTypeLabel(t)}
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
          href="/sows"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{sows.length} shown</Badge>
      </div>

      {sows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            No SOW templates yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Create a service scope template with standard work, add-ons, photo proof, SLA, and
            approval gates — then activate it for properties.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sows.map((sow) => (
            <SowCard key={sow.id} sow={sow} />
          ))}
        </div>
      )}
    </div>
  );
}
