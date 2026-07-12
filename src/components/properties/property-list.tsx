import Link from "next/link";
import { Badge } from "@/components/ui";
import { PropertyCard } from "@/components/properties/property-card";
import type { listProperties } from "@/lib/properties";

type PropertyListItem = Awaited<ReturnType<typeof listProperties>>[number];

export function PropertyList({ properties }: { properties: PropertyListItem[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/70 px-6 py-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
          No properties yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
          Add your first STR unit to attach calendars, SOPs, SOW templates, and default cleaners.
          Turnover generation in the next phase will use this context.
        </p>
      </div>
    );
  }

  const ready = properties.filter((p) => p.readiness.label === "Ready").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Badge tone="accent">{properties.length} total</Badge>
        <Badge tone="success">{ready} turnover-ready</Badge>
        <Badge tone="warning">{properties.length - ready} need setup</Badge>
      </div>
      <div className="grid gap-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Tip: open a property to link SOP/SOW, set photo proof rules, and connect calendars before
        the next phase generates turnovers.{" "}
        <Link href="/dashboard" className="text-[var(--accent)]">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
