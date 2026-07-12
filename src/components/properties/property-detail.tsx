import Link from "next/link";
import { Badge } from "@/components/ui";
import type { getPropertyDetail } from "@/lib/properties";
import { unitTypeLabel } from "@/lib/properties";
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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Property profile
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {property.address}, {property.city}, {property.state}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={property.active ? "success" : "danger"}>
              {property.active ? "Active" : "Inactive"}
            </Badge>
            <Badge tone="neutral">{unitTypeLabel(property.unitType)}</Badge>
            <Badge
              tone={
                property.readiness.label === "Ready"
                  ? "success"
                  : property.readiness.label === "Almost ready"
                    ? "warning"
                    : "danger"
              }
            >
              {property.readiness.label} · {property.readiness.score}%
            </Badge>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Unit code</dt>
            <dd className="font-medium">{property.unitCode}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Beds / baths</dt>
            <dd className="font-medium">
              {property.bedrooms} / {property.bathrooms}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Max guests</dt>
            <dd className="font-medium">{property.maxGuests}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Default cleaner</dt>
            <dd className="font-medium">{property.defaultVendor?.name ?? "Not set"}</dd>
          </div>
        </dl>

        {property.accessNotes ? (
          <p className="mt-4 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2 text-sm">
            <span className="font-semibold">Access: </span>
            {property.accessNotes}
          </p>
        ) : null}
        {property.notes ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{property.notes}</p>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <LinkedSops sop={property.sop} />
        <LinkedSows sow={property.sow} />
        <CalendarConnections property={property} />
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Assigned cleaner / vendor
          </h2>
          {property.defaultVendor ? (
            <div className="mt-3 rounded-xl border border-[var(--border)] px-3 py-3">
              <p className="font-medium">{property.defaultVendor.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {property.defaultVendor.email}
                {property.defaultVendor.phone ? ` · ${property.defaultVendor.phone}` : ""}
              </p>
              <Badge>{property.defaultVendor.type}</Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No default cleaner set. Choose one in property settings so the next phase can prefill
              assignments.
            </p>
          )}
          <div className="mt-4 text-xs text-[var(--muted)]">
            Buffer {property.turnoverBufferMins}m · Same-day turnovers{" "}
            {property.sameDayTurnover ? "allowed" : "blocked"}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Recent turnovers
          </h2>
          {property.turnovers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No turnovers yet. Once calendar sync generates jobs, they will show here.
            </p>
          ) : (
            <div className="space-y-2">
              {property.turnovers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{formatDateTime(t.windowStart)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {t.vendor?.name ?? "Unassigned"}
                      {t.issues.length ? ` · ${t.issues.length} open issue(s)` : ""}
                    </p>
                  </div>
                  <Badge>{statusLabel(t.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Recent issues
          </h2>
          {openIssues.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No open issues linked to this property’s recent turnovers.
            </p>
          ) : (
            <div className="space-y-2">
              {openIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="block rounded-xl border border-[var(--border)] px-3 py-2 transition hover:border-[var(--accent)]/40"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {issue.severity} · {statusLabel(issue.status)} · {issue.category}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <PropertySettings property={property} options={options} />
    </div>
  );
}
