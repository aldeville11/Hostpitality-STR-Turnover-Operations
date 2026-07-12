import { Badge } from "@/components/ui";
import { LaunchPanel } from "@/components/launch/launch-panel";
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
    <LaunchPanel
      title="Launch checklist"
      description="Production readiness gates for Hostpitality. Failures block a confident ship."
      actions={
        <div className="text-right">
          <Badge tone={ready ? "success" : "warning"}>
            {ready ? "Ready to launch" : "Not ready"}
          </Badge>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {score.done}/{score.total} complete
          </p>
        </div>
      }
    >
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
              <Badge tone={item.done ? "success" : "warning"}>
                {item.done ? "Done" : "Open"}
              </Badge>
            </div>
            <p className="mt-1 text-xs opacity-90">{item.detail}</p>
          </li>
        ))}
      </ul>
    </LaunchPanel>
  );
}
