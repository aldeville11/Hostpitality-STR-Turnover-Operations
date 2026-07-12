import Link from "next/link";
import { Badge, EmptyState, ModuleCard, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { mapInventoryStock } from "@/lib/status-map";

export function InventoryAlerts({
  alerts,
}: {
  alerts: DashboardData["inventoryAlerts"];
}) {
  return (
    <ModuleCard
      title="Inventory shortages"
      description="Items at or below reorder threshold."
      actions={
        <>
          <Badge tone={alerts.length ? "warning" : "success"}>{alerts.length}</Badge>
          <Link
            href="/inventory"
            className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
          >
            Inventory
          </Link>
        </>
      }
    >
      {alerts.length === 0 ? (
        <EmptyState
          title="No inventory alerts"
          description="Stock levels look healthy. Items at or below reorder threshold will appear here."
          action={
            <Link
              href="/inventory"
              className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
            >
              Open inventory →
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {alerts.map((item) => (
            <li
              key={item.id}
              className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.category}
                  {item.property ? ` · ${item.property.name}` : " · Shared stock"}
                </p>
              </div>
              <StatusBadge status={mapInventoryStock(item.quantity, item.reorderLevel)}>
                {item.quantity}/{item.reorderLevel} {item.unit}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
