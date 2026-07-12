import Link from "next/link";
import { Badge, DetailFactGrid, DetailSection, EmptyState, StatusBadge } from "@/components/ui";
import type { getPropertyDetail } from "@/lib/properties";
import { unitTypeLabel } from "@/lib/properties";
import { mapActive, mapReadiness, mapTurnoverStatus } from "@/lib/status-map";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { LinkedSops } from "@/components/properties/linked-sops";
import { LinkedSows } from "@/components/properties/linked-sows";
import { CalendarConnections } from "@/components/properties/calendar-connections";
import { PropertySettings } from "@/components/properties/property-settings";

type Detail = NonNullable<Awaited<ReturnType<typeof getPropertyDetail>>>;

export function PropertyDetail({ data }: { data: Detail }) {
  const { property, openIssues, options } = data;

  return (
    <div className="space-y-6">
      <DetailSection
        title="Property profile"
        description={`${property.address}, ${property.city}, ${property.state}`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={mapActive(property.active)}>
              {property.active ? "Active" : "Inactive"}
            </StatusBadge>
            <Badge tone="neutral">{unitTypeLabel(property.unitType)}</Badge>
            <StatusBadge status={mapReadiness(property.readiness.label)}>
              {property.readiness.label} · {property.readiness.score}%
            </StatusBadge>
          </div>
        }
      >
        <DetailFactGrid
          items={[
            { label: "Unit code", value: property.unitCode },
            {
              label: "Beds / baths",
              value: `${property.bedrooms} / ${property.bathrooms}`,
            },
            { label: "Max guests", value: property.maxGuests },
            {
              label: "Default cleaner",
              value: property.defaultVendor?.name ?? "Not set",
            },
          ]}
        />

        {property.accessNotes ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--surface-2)]/60 px-3 py-2 text-sm text-[var(--text-primary)]">
            <span className="font-semibold">Access: </span>
            {property.accessNotes}
          </p>
        ) : null}
        {property.notes ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{property.notes}</p>
        ) : null}
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <LinkedSops sop={property.sop} />
        <LinkedSows sow={property.sow} />
        <CalendarConnections property={property} />
        <DetailSection title="Assigned cleaner / vendor">
          {property.defaultVendor ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-3">
              <p className="font-medium text-[var(--text-primary)]">{property.defaultVendor.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {property.defaultVendor.email}
                {property.defaultVendor.phone ? ` · ${property.defaultVendor.phone}` : ""}
              </p>
              <Badge>{property.defaultVendor.type}</Badge>
            </div>
          ) : (
            <EmptyState
              title="No default cleaner"
              description="Choose one in property settings so the next phase can prefill assignments."
            />
          )}
          <div className="mt-4 text-xs text-[var(--text-secondary)]">
            Buffer {property.turnoverBufferMins}m · Same-day turnovers{" "}
            {property.sameDayTurnover ? "allowed" : "blocked"}
          </div>
        </DetailSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection title="Recent turnovers">
          {property.turnovers.length === 0 ? (
            <EmptyState
              title="No turnovers yet"
              description="Once calendar sync generates jobs, they will show here."
            />
          ) : (
            <div className="space-y-2">
              {property.turnovers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {formatDateTime(t.windowStart)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {t.vendor?.name ?? "Unassigned"}
                      {t.issues.length ? ` · ${t.issues.length} open issue(s)` : ""}
                    </p>
                  </div>
                  <StatusBadge status={mapTurnoverStatus(t.status)}>
                    {statusLabel(t.status)}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        <DetailSection title="Recent issues">
          {openIssues.length === 0 ? (
            <EmptyState
              title="No open issues"
              description="No open issues linked to this property’s recent turnovers."
            />
          ) : (
            <div className="space-y-2">
              {openIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="block rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 transition hover:border-[var(--accent)]/40"
                >
                  <p className="font-medium text-[var(--text-primary)]">{issue.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {issue.severity} · {statusLabel(issue.status)} · {issue.category}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </DetailSection>
      </div>

      <PropertySettings property={property} options={options} />
    </div>
  );
}
