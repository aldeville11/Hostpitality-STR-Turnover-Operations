"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import { updatePropertyCalendarAction } from "@/lib/property-actions";
import { BOOKING_SOURCES, calendarStatusLabel } from "@/lib/properties";
import { formatDateTime } from "@/lib/utils";

type PropertyCalendar = {
  id: string;
  calendarUrl: string | null;
  bookingSource: string;
  calendarStatus: string;
  calendarSyncedAt: Date | string | null;
  bookings: { id: string; guestName: string | null; checkOut: Date | string; source: string }[];
};

export function CalendarConnections({ property }: { property: PropertyCalendar }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Calendar & booking source
        </h2>
        <Badge
          tone={
            property.calendarStatus === "synced"
              ? "success"
              : property.calendarStatus === "error"
                ? "danger"
                : "warning"
          }
        >
          {calendarStatusLabel(property.calendarStatus)}
        </Badge>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Connect an ICS feed or note the booking source. Phase 5 will use this to generate turnover
        jobs automatically.
      </p>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">Source</dt>
          <dd className="font-medium">{property.bookingSource}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">ICS URL</dt>
          <dd className="max-w-[60%] truncate font-medium">
            {property.calendarUrl ?? "Not set"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--muted)]">Last sync</dt>
          <dd className="font-medium">
            {property.calendarSyncedAt ? formatDateTime(property.calendarSyncedAt) : "Never"}
          </dd>
        </div>
      </dl>

      {property.bookings.length > 0 ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Recent bookings
          </p>
          {property.bookings.slice(0, 3).map((b) => (
            <p key={b.id} className="text-xs text-[var(--muted)]">
              {b.guestName ?? "Guest"} · checkout {formatDateTime(b.checkOut)} · {b.source}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--muted)]">
          No imported bookings yet — sync status prepares the property for turnover generation.
        </p>
      )}

      <form
        className="mt-4 space-y-3 rounded-xl border border-[var(--border)] p-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await updatePropertyCalendarAction(fd);
            if (res?.error) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <input type="hidden" name="id" value={property.id} />
        <div>
          <Label htmlFor="bookingSource">Booking source</Label>
          <Select id="bookingSource" name="bookingSource" defaultValue={property.bookingSource}>
            {BOOKING_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="calendarUrl">iCal / ICS URL</Label>
          <Input
            id="calendarUrl"
            name="calendarUrl"
            defaultValue={property.calendarUrl ?? ""}
            placeholder="https://…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" name="markSynced" value="true" className="rounded border" />
          Mark as synced now (prep for turnover generation)
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save calendar connection"}
        </Button>
      </form>
    </section>
  );
}
