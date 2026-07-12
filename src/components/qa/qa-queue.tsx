import Link from "next/link";
import { Badge } from "@/components/ui";
import { QaCard } from "@/components/qa/qa-card";
import { QA_STATUSES, QA_STATUS_LABELS, type listQaQueue } from "@/lib/qa";

type QueueRow = Awaited<ReturnType<typeof listQaQueue>>[number];

export function QaQueue({
  items,
  filters,
  properties,
  inspectors,
}: {
  items: QueueRow[];
  filters: {
    status?: string;
    propertyId?: string;
    inspectorId?: string;
    q?: string;
  };
  properties: { id: string; name: string; unitCode: string }[];
  inspectors: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-3">
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search property or cleaner"
          className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">Queue (pending / rework)</option>
          {QA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QA_STATUS_LABELS[s]}
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
        <select
          name="inspectorId"
          defaultValue={filters.inspectorId ?? ""}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All inspectors</option>
          {inspectors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
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
          href="/qa"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{items.length} shown</Badge>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            QA queue is clear
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Turnovers marked Ready for QA will appear here for pass/fail inspection against the
            property SOP and SOW.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <QaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
