import { Badge } from "@/components/ui";
import { IntegrationCard } from "@/components/integrations/integration-card";
import type { IntegrationListItem } from "@/lib/integrations";

const CATEGORY_ORDER = ["BOOKING", "CALENDAR", "MESSAGING", "STORAGE"] as const;

export function IntegrationList({
  integrations,
}: {
  integrations: IntegrationListItem[];
}) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: integrations.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  const connected = integrations.filter((i) => i.status === "CONNECTED" && i.enabled).length;
  const errors = integrations.filter((i) => i.status === "ERROR").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge tone="accent">{integrations.length} services</Badge>
        <Badge tone="success">{connected} connected</Badge>
        {errors ? <Badge tone="danger">{errors} with errors</Badge> : null}
      </div>

      {grouped.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {group.category.charAt(0) + group.category.slice(1).toLowerCase()}
          </h2>
          <div className="space-y-2">
            {group.items.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
