import Link from "next/link";
import { Badge } from "@/components/ui";
import type { listProperties } from "@/lib/properties";
import { unitTypeLabel } from "@/lib/properties";

type PropertyListItem = Awaited<ReturnType<typeof listProperties>>[number];

function readinessTone(label: string): "success" | "warning" | "danger" {
  if (label === "Ready") return "success";
  if (label === "Almost ready") return "warning";
  return "danger";
}

export function PropertyCard({ property }: { property: PropertyListItem }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {property.name}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {property.unitCode} · {property.address}, {property.city}, {property.state}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="neutral">{unitTypeLabel(property.unitType)}</Badge>
            <Badge tone="info">
              {property.bedrooms} bed / {property.bathrooms} bath
            </Badge>
            <Badge tone={property.active ? "success" : "danger"}>
              {property.active ? "Active" : "Inactive"}
            </Badge>
            {property.defaultVendor ? (
              <Badge>{property.defaultVendor.name}</Badge>
            ) : (
              <Badge tone="warning">No default cleaner</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge tone={readinessTone(property.readiness.label)}>
            {property.readiness.label} · {property.readiness.score}%
          </Badge>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {property._count.turnovers} turnovers · {property._count.bookings} bookings
          </p>
        </div>
      </div>
      {property.readiness.missing.length > 0 ? (
        <p className="mt-3 text-xs text-amber-800">
          Missing: {property.readiness.missing.join(", ")}
        </p>
      ) : (
        <p className="mt-3 text-xs text-emerald-700">Operational context is complete for turnovers.</p>
      )}
    </Link>
  );
}
