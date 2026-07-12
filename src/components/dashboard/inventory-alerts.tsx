import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

export function InventoryAlerts({
  alerts,
}: {
  alerts: DashboardData["inventoryAlerts"];
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Inventory alerts
        </h2>
        <Badge tone={alerts.length ? "warning" : "success"}>{alerts.length}</Badge>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Stock levels look healthy. Items at or below reorder threshold will show here.
        </p>
      ) : (
        <div className="space-y-2">
          {alerts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.category}
                  {item.property ? ` · ${item.property.name}` : " · Shared stock"}
                </p>
              </div>
              <Badge tone="warning">
                {item.quantity}/{item.reorderLevel} {item.unit}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
