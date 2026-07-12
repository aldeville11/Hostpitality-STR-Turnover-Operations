"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { AvailabilityToggle } from "@/components/cleaners/availability-toggle";
import { AssignmentPanel } from "@/components/cleaners/assignment-panel";
import { WorkloadCalendar } from "@/components/cleaners/workload-calendar";
import { ConflictAlert } from "@/components/cleaners/conflict-alert";
import { updateCleanerProfileAction } from "@/lib/cleaner-actions";
import {
  AVAILABILITY_LABELS,
  TYPE_LABELS,
  type AssignmentConflict,
  type AvailabilityStatus,
} from "@/lib/cleaners";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { assignFromCleanersAction } from "@/lib/cleaner-actions";

type Detail = {
  vendor: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    type: string;
    notes: string | null;
    rating: number;
    capacity: number;
    availabilityStatus: string;
    unavailableUntil: Date | string | null;
    unavailableReason: string | null;
    coverageAreas: string[];
    skills: string[];
    available: boolean;
    openLoad: number;
    assignments: Array<{
      id: string;
      status: string;
      priority: string;
      windowStart: Date | string;
      windowEnd: Date | string;
      deadlineAt: Date | string;
      vendorId: string | null;
      property: { name: string; unitCode: string; city: string };
      sop: { name: string } | null;
      sow: { name: string; slaMinutes: number } | null;
    }>;
    defaultProperties: Array<{
      id: string;
      name: string;
      unitCode: string;
      city: string;
      unitType: string;
    }>;
  };
  workloadDays: Array<{
    date: string;
    label: string;
    jobs: Array<{
      id: string;
      propertyName: string;
      unitCode: string;
      status: string;
      windowStart: Date | string;
      windowEnd: Date | string;
      deadlineAt: Date | string;
      priority: string;
    }>;
  }>;
  conflicts: AssignmentConflict[];
  gaps: Array<{
    id: string;
    propertyName: string;
    unitCode: string;
    city: string;
    status: string;
    priority: string;
    windowStart: Date | string;
    deadlineAt: Date | string;
  }>;
  unassigned: Array<{
    id: string;
    status: string;
    priority: string;
    windowStart: Date | string;
    deadlineAt: Date | string;
    vendorId: string | null;
    property: { name: string; unitCode: string; city: string };
  }>;
  assignmentHistory: Array<{
    id: string;
    fromName: string | null;
    toName: string | null;
    note: string | null;
    actorName: string | null;
    createdAt: Date | string;
    turnover: { id: string; property: { name: string; unitCode: string } };
  }>;
};

export function CleanerDetail({
  data,
  canManage,
}: {
  data: Detail;
  canManage: boolean;
}) {
  const { vendor } = data;
  const [coverageAreas, setCoverageAreas] = useState(vendor.coverageAreas.join(", "));
  const [skills, setSkills] = useState(vendor.skills.join(", "));
  const [capacity, setCapacity] = useState(String(vendor.capacity));
  const [rating, setRating] = useState(String(vendor.rating));
  const [phone, setPhone] = useState(vendor.phone ?? "");
  const [notes, setNotes] = useState(vendor.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{TYPE_LABELS[vendor.type] ?? vendor.type}</Badge>
        <Badge
          tone={
            vendor.available
              ? "success"
              : vendor.availabilityStatus === "OUT_OF_SERVICE"
                ? "danger"
                : "warning"
          }
        >
          {AVAILABILITY_LABELS[vendor.availabilityStatus as AvailabilityStatus] ??
            vendor.availabilityStatus}
        </Badge>
        <Badge tone="accent">
          Load {vendor.openLoad}/{vendor.capacity}
        </Badge>
        <Badge tone="info">Rating {vendor.rating.toFixed(1)}</Badge>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Profile
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {vendor.email}
          {vendor.phone ? ` · ${vendor.phone}` : ""}
        </p>
        {vendor.defaultProperties.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {vendor.defaultProperties.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`}>
                <Badge tone="info">
                  Default · {p.name} ({p.unitCode})
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}

        {canManage ? (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            action={(fd) => {
              setError(null);
              setMessage(null);
              startTransition(async () => {
                const res = await updateCleanerProfileAction(fd);
                if (res?.error) setError(res.error);
                else {
                  setMessage("Profile saved");
                  router.refresh();
                }
              });
            }}
          >
            <input type="hidden" name="vendorId" value={vendor.id} />
            <div>
              <Label htmlFor="coverageAreas">Coverage areas (comma-separated)</Label>
              <Input
                id="coverageAreas"
                name="coverageAreas"
                value={coverageAreas}
                onChange={(e) => setCoverageAreas(e.target.value)}
                placeholder="Santa Barbara, Montecito"
              />
            </div>
            <div>
              <Label htmlFor="skills">Skills / unit types</Label>
              <Input
                id="skills"
                name="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="apartment, house, deep_clean"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (open jobs)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rating">Rating (0–5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={pending}>
                Save profile
              </Button>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </div>
          </form>
        ) : null}
      </section>

      {data.conflicts.length ? (
        <ConflictAlert conflicts={data.conflicts} title="Coverage conflicts & risks" />
      ) : null}

      <WorkloadCalendar days={data.workloadDays} />

      <div className="grid gap-6 xl:grid-cols-2">
        {canManage ? (
          <AssignmentPanel
            cleanerId={vendor.id}
            cleanerName={vendor.name}
            assignedTurnovers={vendor.assignments}
            unassignedTurnovers={data.unassigned}
          />
        ) : null}

        <AvailabilityToggle
          vendorId={vendor.id}
          status={vendor.availabilityStatus}
          unavailableUntil={vendor.unavailableUntil}
          unavailableReason={vendor.unavailableReason}
        />
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Coverage gaps
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Unassigned turnovers in this cleaner&apos;s service area (or all areas if coverage is
          unset).
        </p>
        {data.gaps.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No gaps in the next two weeks.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.gaps.map((gap) => (
              <li
                key={gap.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {gap.propertyName}{" "}
                    <span className="text-[var(--muted)]">
                      · {gap.unitCode} · {gap.city}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateTime(gap.windowStart)} · due {formatDateTime(gap.deadlineAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warning">{statusLabel(gap.status)}</Badge>
                  {canManage ? (
                    <form
                      action={(fd) => {
                        startTransition(async () => {
                          fd.set("manualOverride", "1");
                          await assignFromCleanersAction(fd);
                          router.refresh();
                        });
                      }}
                    >
                      <input type="hidden" name="turnoverId" value={gap.id} />
                      <input type="hidden" name="vendorId" value={vendor.id} />
                      <input type="hidden" name="reason" value="Fill coverage gap" />
                      <Button type="submit" size="sm" variant="outline" disabled={pending}>
                        Assign here
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Assignment history
        </h2>
        {data.assignmentHistory.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No assignment changes yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {data.assignmentHistory.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="neutral">{event.fromName ?? "Unassigned"}</Badge>
                  <span className="text-[var(--muted)]">→</span>
                  <Badge tone="accent">{event.toName ?? "Unassigned"}</Badge>
                  <Link
                    href={`/turnovers/${event.turnover.id}`}
                    className="ml-auto text-xs text-[var(--accent)] hover:underline"
                  >
                    {event.turnover.property.name}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDateTime(event.createdAt)}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                </p>
                {event.note ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">{event.note}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
