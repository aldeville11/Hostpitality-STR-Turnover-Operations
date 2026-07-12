"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { AssignmentPanel } from "@/components/turnovers/assignment-panel";
import { ChecklistPanel } from "@/components/turnovers/checklist-panel";
import { LinkedContext } from "@/components/turnovers/linked-context";
import { StatusTimeline } from "@/components/turnovers/status-timeline";
import { updateTurnoverStatusAction } from "@/lib/turnover-actions";
import type { getTurnoverDetail } from "@/lib/turnovers";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { priorityTone, turnoverStatusTone } from "@/lib/dashboard";

type Detail = NonNullable<Awaited<ReturnType<typeof getTurnoverDetail>>>;

export function TurnoverDetail({
  data,
  canManage,
  canAssign,
}: {
  data: Detail;
  canManage: boolean;
  canAssign: boolean;
}) {
  const { turnover, vendors, photoRequirements, restockDefaults, allowedNextStatuses, checklistProgress } =
    data;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={turnoverStatusTone(turnover.status)}>{statusLabel(turnover.status)}</Badge>
        <Badge tone={priorityTone(turnover.priority)}>{turnover.priority}</Badge>
        <Badge tone="neutral">
          Checklist {checklistProgress.done}/{checklistProgress.total}
        </Badge>
        <Badge tone="info">
          Photos {turnover.photosUploaded}/{turnover.photosRequired}
        </Badge>
        {["READY_FOR_QA", "NEEDS_REWORK", "COMPLETED"].includes(turnover.status) ? (
          <Link href={`/qa/${turnover.id}`}>
            <Badge tone="accent">Open QA</Badge>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Meta label="Scheduled window" value={`${formatDateTime(turnover.windowStart)} – ${formatDateTime(turnover.windowEnd)}`} />
        <Meta label="Due" value={formatDateTime(turnover.deadlineAt)} />
        <Meta label="Cleaner" value={turnover.vendor?.name ?? "Unassigned"} />
        <Meta
          label="Booking"
          value={
            turnover.booking
              ? `${turnover.booking.source} · ${turnover.booking.guestName ?? "Guest"}`
              : "No booking linked"
          }
        />
      </div>

      {canManage && allowedNextStatuses.length > 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Advance status
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Lifecycle through Ready for QA. Transitions are audited.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
              {allowedNextStatuses.map((status) => (
                <form
                  key={status}
                  action={(fd) => {
                    setError(null);
                    startTransition(async () => {
                      const res = await updateTurnoverStatusAction(fd);
                      if (res?.error) setError(res.error);
                      else router.refresh();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={turnover.id} />
                  <input type="hidden" name="toStatus" value={status} />
                  <input type="hidden" name="note" value="" />
                  <Button
                    type="submit"
                    size="sm"
                    variant={
                      status === "BLOCKED"
                        ? "danger"
                        : status === "READY_FOR_QA"
                          ? "primary"
                          : "outline"
                    }
                    disabled={pending}
                  >
                    {statusLabel(status)}
                  </Button>
                </form>
              ))}
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Booking & schedule
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="Guest check-out" value={turnover.booking ? formatDateTime(turnover.booking.checkOut) : "—"} />
              <Field label="Guest check-in" value={turnover.booking ? formatDateTime(turnover.booking.checkIn) : "—"} />
              <Field label="Window start" value={formatDateTime(turnover.windowStart)} />
              <Field label="Window end" value={formatDateTime(turnover.windowEnd)} />
              <Field label="Deadline" value={formatDateTime(turnover.deadlineAt)} />
              <Field label="External booking" value={turnover.booking?.externalId ?? "—"} />
            </div>
            {turnover.notes ? (
              <p className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-sm text-[var(--muted)]">
                {turnover.notes}
              </p>
            ) : null}
          </section>

          <ChecklistPanel turnoverId={turnover.id} items={turnover.checklistItems} />
        </div>

        <div className="space-y-6">
          {canAssign ? (
            <AssignmentPanel
              turnoverId={turnover.id}
              currentVendorId={turnover.vendorId}
              currentVendorName={turnover.vendor?.name ?? null}
              vendors={vendors}
              history={turnover.assignmentEvents}
            />
          ) : (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Cleaner assignment
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {turnover.vendor?.name ?? "Unassigned"}
              </p>
            </section>
          )}

          <LinkedContext
            property={{
              name: turnover.property.name,
              unitCode: turnover.property.unitCode,
              accessNotes: turnover.property.accessNotes,
            }}
            booking={turnover.booking}
            sop={turnover.sop}
            sow={turnover.sow}
            photoRequirements={photoRequirements}
            restockDefaults={restockDefaults}
          />

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Issues
              </h2>
              <Link
                href={`/issues?propertyId=${turnover.propertyId}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                View all
              </Link>
            </div>
            {turnover.issues.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">No issues linked to this turnover.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {turnover.issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="block rounded-xl border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{issue.title}</p>
                        {issue.blocking ? <Badge tone="danger">Blocking</Badge> : null}
                        <Badge tone="neutral">{statusLabel(issue.status)}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {issue.severity} · {issue.category}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link href={`/issues?propertyId=${turnover.propertyId}`}>
                <Button type="button" size="sm" variant="outline">
                  Open issue tracker
                </Button>
              </Link>
            </div>
          </section>

          <StatusTimeline events={turnover.statusEvents} currentStatus={turnover.status} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-[var(--ink)]">{value}</p>
    </div>
  );
}
