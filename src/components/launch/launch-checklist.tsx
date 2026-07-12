import type { LaunchChecklist as LaunchChecklistData } from "@/lib/launch";

type ChecklistItem = LaunchChecklistData["items"][number];

export function LaunchChecklist({
  items,
  ready,
  score,
}: {
  items: ChecklistItem[];
  ready: boolean;
  score: { done: number; total: number };
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Launch checklist
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Production readiness gates for Hostpitality. Failures block a confident ship.
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${
              ready ? "text-emerald-800" : "text-amber-900"
            }`}
          >
            {ready ? "Ready to launch" : "Not ready"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {score.done}/{score.total} complete
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border px-4 py-3 ${
              item.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{item.title}</p>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                {item.done ? "Done" : "Open"}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-90">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
