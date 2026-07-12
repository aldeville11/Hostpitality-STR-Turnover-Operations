import Link from "next/link";
import { Badge } from "@/components/ui";
import { SopCard } from "@/components/sops/sop-card";
import { SOP_STATUSES, STATUS_LABELS } from "@/lib/sops";
import type { listSops } from "@/lib/sops";

type SopRow = Awaited<ReturnType<typeof listSops>>[number];

export function SopList({
  sops,
  filters,
  properties,
}: {
  sops: SopRow[];
  filters: { status?: string; propertyId?: string; q?: string };
  properties: { id: string; name: string; unitCode: string }[];
}) {
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search SOPs"
          className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {SOP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
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
          href="/sops"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{sops.length} shown</Badge>
      </div>

      {sops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            No SOPs yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Start from a rental-type template or create a blank playbook. Published SOPs become the
            checklist source for turnovers.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sops.map((sop) => (
            <SopCard key={sop.id} sop={sop} />
          ))}
        </div>
      )}
    </div>
  );
}
