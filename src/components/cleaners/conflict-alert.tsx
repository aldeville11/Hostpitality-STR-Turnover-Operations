import { Badge } from "@/components/ui";
import type { AssignmentConflict } from "@/lib/cleaners";

export function ConflictAlert({
  conflicts,
  title = "Assignment checks",
}: {
  conflicts: AssignmentConflict[];
  title?: string;
}) {
  if (!conflicts.length) return null;

  const blockers = conflicts.filter((c) => c.severity === "block");
  const warnings = conflicts.filter((c) => c.severity === "warn");

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        blockers.length
          ? "border-rose-200 bg-rose-50/80"
          : "border-amber-200 bg-amber-50/70"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p
          className={`text-sm font-semibold ${
            blockers.length ? "text-rose-900" : "text-amber-900"
          }`}
        >
          {title}
        </p>
        {blockers.length ? <Badge tone="danger">{blockers.length} block</Badge> : null}
        {warnings.length ? <Badge tone="warning">{warnings.length} warn</Badge> : null}
      </div>
      <ul
        className={`space-y-1 text-xs ${
          blockers.length ? "text-rose-900/90" : "text-amber-900/90"
        }`}
      >
        {conflicts.map((c, idx) => (
          <li key={`${c.code}-${idx}`}>
            <span className="font-medium uppercase tracking-wide">{c.severity}</span>
            {" · "}
            {c.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
