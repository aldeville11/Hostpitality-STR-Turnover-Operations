"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  DetailFactGrid,
  DetailSection,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { AssignmentPanel } from "@/components/turnovers/assignment-panel";
import { ChecklistPanel } from "@/components/turnovers/checklist-panel";
import { LinkedContext } from "@/components/turnovers/linked-context";
import { StatusTimeline } from "@/components/turnovers/status-timeline";
import { updateTurnoverStatusAction } from "@/lib/turnover-actions";
import type { getTurnoverDetail } from "@/lib/turnovers";
import { mapIssueStatus, mapTurnoverStatus } from "@/lib/status-map";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { priorityTone } from "@/lib/dashboard";

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
        <StatusBadge status={mapTurnoverStatus(turnover.status)}>
          {statusLabel(turnover.status)}
        </StatusBadge>
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

      <DetailFactGrid
        items={[
          {
            label: "Scheduled window",
            value: `${formatDateTime(turnover.windowStart)} – ${formatDateTime(turnover.windowEnd)}`,
          },
          { label: "Due", value: formatDateTime(turnover.deadlineAt) },
          { label: "Cleaner", value: turnover.vendor?.name ?? "Unassigned" },
          {
            label: "Booking",
            value: turnover.booking
              ? `${turnover.booking.source} · ${turnover.booking.guestName ?? "Guest"}`
              : "No booking linked",
          },
        ]}
      />

      {canManage && allowedNextStatuses.length > 0 ? (
        <DetailSection
          title="Advance status"
          description="Lifecycle through Ready for QA. Transitions are audited."
        >
          <div className="flex flex-wrap gap-2">
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
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </DetailSection>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <DetailSection title="Booking & schedule">
            <DetailFactGrid
              items={[
                {
                  label: "Guest check-out",
                  value: turnover.booking ? formatDateTime(turnover.booking.checkOut) : "—",
                },
                {
                  label: "Guest check-in",
                  value: turnover.booking ? formatDateTime(turnover.booking.checkIn) : "—",
                },
                { label: "Window start", value: formatDateTime(turnover.windowStart) },
                { label: "Window end", value: formatDateTime(turnover.windowEnd) },
                { label: "Deadline", value: formatDateTime(turnover.deadlineAt) },
                {
                  label: "External booking",
                  value: turnover.booking?.externalId ?? "—",
                },
              ]}
            />
            {turnover.notes ? (
              <p className="mt-4 whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2 text-sm text-[var(--text-secondary)]">
                {turnover.notes}
              </p>
            ) : null}
          </DetailSection>

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
            <DetailSection title="Cleaner assignment">
              <p className="text-sm text-[var(--text-secondary)]">
                {turnover.vendor?.name ?? "Unassigned"}
              </p>
            </DetailSection>
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

          <DetailSection
            title="Issues"
            actions={
              <Link
                href={`/issues?propertyId=${turnover.propertyId}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                View all
              </Link>
            }
          >
            {turnover.issues.length === 0 ? (
              <EmptyState
                title="No issues"
                description="No issues linked to this turnover."
              />
            ) : (
              <ul className="space-y-2">
                {turnover.issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="block rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[var(--text-primary)]">{issue.title}</p>
                        {issue.blocking ? <Badge tone="danger">Blocking</Badge> : null}
                        <StatusBadge status={mapIssueStatus(issue.status)}>
                          {statusLabel(issue.status)}
                        </StatusBadge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
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
          </DetailSection>

          <StatusTimeline events={turnover.statusEvents} currentStatus={turnover.status} />
        </div>
      </div>
    </div>
  );
}
