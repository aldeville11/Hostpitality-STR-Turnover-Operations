import { Badge } from "@/components/ui";
import { parseJson } from "@/lib/json";
import type { PhotoRequirement, RestockDefault } from "@/lib/properties";
import { formatDateTime } from "@/lib/utils";

type LinkedContextProps = {
  property: {
    name: string;
    unitCode: string;
    accessNotes: string | null;
  };
  booking: {
    guestName: string | null;
    checkIn: Date | string;
    checkOut: Date | string;
    source: string;
  } | null;
  sop: {
    name: string;
    description: string | null;
    contentJson: string;
  } | null;
  sow: {
    name: string;
    standardScope: string;
    addOnsJson: string;
    slaMinutes: number;
  } | null;
  photoRequirements: PhotoRequirement[];
  restockDefaults: RestockDefault[];
};

export function LinkedContext({
  property,
  booking,
  sop,
  sow,
  photoRequirements,
  restockDefaults,
}: LinkedContextProps) {
  const addOns = parseJson<string[]>(sow?.addOnsJson, []);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Linked context
      </h2>

      <div className="mt-4 space-y-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Property
          </p>
          <p className="font-medium">
            {property.name} · {property.unitCode}
          </p>
          {property.accessNotes ? (
            <p className="text-[var(--muted)]">Access: {property.accessNotes}</p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Booking source
          </p>
          {booking ? (
            <p className="text-[var(--muted)]">
              {booking.source} · {booking.guestName ?? "Guest"} ·{" "}
              {formatDateTime(booking.checkIn)} → {formatDateTime(booking.checkOut)}
            </p>
          ) : (
            <p className="text-[var(--muted)]">No booking linked</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">SOP</p>
          {sop ? (
            <>
              <p className="font-medium">{sop.name}</p>
              <p className="text-[var(--muted)]">{sop.description}</p>
            </>
          ) : (
            <p className="text-[var(--muted)]">No SOP linked</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            SOW template
          </p>
          {sow ? (
            <>
              <p className="font-medium">
                {sow.name} <Badge tone="info">{sow.slaMinutes}m SLA</Badge>
              </p>
              <p className="text-[var(--muted)]">{sow.standardScope}</p>
              {addOns.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {addOns.map((a) => (
                    <Badge key={a} tone="neutral">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[var(--muted)]">No SOW linked</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Required photos
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {photoRequirements.map((p) => (
              <Badge key={p.label} tone={p.required ? "info" : "neutral"}>
                {p.label}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Restock items
          </p>
          <ul className="mt-1 space-y-0.5 text-[var(--muted)]">
            {restockDefaults.map((r) => (
              <li key={r.name}>
                {r.name} — {r.quantity} {r.unit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
