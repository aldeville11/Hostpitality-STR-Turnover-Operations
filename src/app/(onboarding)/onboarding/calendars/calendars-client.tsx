"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepCard } from "@/components/onboarding/step-card";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import {
  continueCalendarsAction,
  saveCalendarStepAction,
  skipStepAction,
} from "@/lib/onboarding-actions";

type PropertyRow = {
  id: string;
  name: string;
  unitCode: string;
  calendarUrl: string | null;
  bookingSource: string;
};

export function CalendarsStepClient({ properties }: { properties: PropertyRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [selected, setSelected] = useState(properties[0]?.id ?? "");

  const current = properties.find((p) => p.id === selected) ?? properties[0];

  return (
    <StepCard
      title="Calendars & booking sources"
      description="Optional. Link an ICS calendar URL or note where bookings come from. You can skip and return later."
      actions={
        <div className="flex flex-wrap gap-2">
          <form action={continueCalendarsAction}>
            <Button type="submit">Continue</Button>
          </form>
          <form action={skipStepAction}>
            <input type="hidden" name="stepId" value="calendars" />
            <Button type="submit" variant="ghost">
              Skip for now
            </Button>
          </form>
        </div>
      }
    >
      {properties.length === 0 ? (
        <OnboardingEmptyState
          title="Add a property first"
          description="Calendar links attach to properties. Go back and add at least one unit."
        />
      ) : (
        <>
          <div className="space-y-2">
            {properties.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {p.name} · {p.unitCode}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {p.calendarUrl || "No calendar URL"} · source: {p.bookingSource}
                  </p>
                </div>
                <Badge tone={p.calendarUrl || p.bookingSource !== "manual" ? "success" : "neutral"}>
                  {p.calendarUrl || p.bookingSource !== "manual" ? "Configured" : "Manual"}
                </Badge>
              </div>
            ))}
          </div>

          <form
            className="space-y-3 rounded-xl border border-[var(--border)] p-4"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await saveCalendarStepAction(fd);
                if (res?.error) setError(res.error);
              else router.refresh();
              });
            }}
          >
            <p className="text-sm font-semibold">Configure property calendar</p>
            <div>
              <Label htmlFor="propertyId">Property</Label>
              <Select
                id="propertyId"
                name="propertyId"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unitCode})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="bookingSource">Booking source</Label>
              <Select
                id="bookingSource"
                name="bookingSource"
                defaultValue={current?.bookingSource ?? "manual"}
                key={`source-${current?.id}`}
              >
                <option value="manual">Manual</option>
                <option value="airbnb">Airbnb</option>
                <option value="vrbo">VRBO</option>
                <option value="booking_com">Booking.com</option>
                <option value="direct">Direct</option>
                <option value="pms">PMS / other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="calendarUrl">Calendar URL (ICS)</Label>
              <Input
                id="calendarUrl"
                name="calendarUrl"
                placeholder="https://…"
                defaultValue={current?.calendarUrl ?? ""}
                key={`url-${current?.id}`}
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Saving…" : "Save calendar settings"}
            </Button>
          </form>
        </>
      )}
    </StepCard>
  );
}
