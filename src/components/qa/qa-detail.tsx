"use client";

import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { InspectionChecklist } from "@/components/qa/inspection-checklist";
import { PhotoReview } from "@/components/qa/photo-review";
import { QaDecisionPanel } from "@/components/qa/qa-decision-panel";
import { ReinspectionHistory } from "@/components/qa/reinspection-history";
import { openQaInspectionAction } from "@/lib/qa-actions";
import { createIssuesFromQaAction } from "@/lib/issue-actions";
import { QA_STATUS_LABELS, qaStatusTone, type QaStatus } from "@/lib/qa";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { priorityTone } from "@/lib/dashboard";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Detail = {
  turnover: {
    id: string;
    status: string;
    priority: string;
    notes: string | null;
    deadlineAt: Date | string;
    windowStart: Date | string;
    windowEnd: Date | string;
    photosUploaded: number;
    photosRequired: number;
    photosVerified: number;
    property: {
      id: string;
      name: string;
      unitCode: string;
      city: string;
      address: string;
    };
    vendor: { id: string; name: string; type: string } | null;
    booking: {
      guestName: string | null;
      source: string;
      checkOut: Date | string;
    } | null;
    sop: { id: string; name: string; version: number } | null;
    sow: { id: string; name: string; slaMinutes: number; standardScope: string } | null;
    checklistItems: Array<{
      id: string;
      section: string;
      title: string;
      completed: boolean;
      completedBy: string | null;
    }>;
  };
  latestInspection: {
    id: string;
    status: string;
    inspectorName: string | null;
    inspectorId: string | null;
    overrideIncomplete: boolean;
    decisionNote: string | null;
    startedAt: Date | string | null;
    completedAt: Date | string | null;
    items: Array<{
      id: string;
      section: string;
      title: string;
      result: string;
      comment: string | null;
      checklistItemId: string | null;
    }>;
    photos: Array<{
      id: string;
      label: string;
      required: boolean;
      uploaded: boolean;
      result: string;
      comment: string | null;
    }>;
    events: Array<{
      id: string;
      fromStatus: string | null;
      toStatus: string;
      note: string | null;
      actorName: string | null;
      createdAt: Date | string;
    }>;
  } | null;
  inspections: Array<{
    id: string;
    status: string;
    inspectorName: string | null;
    decisionNote: string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
    overrideIncomplete: boolean;
    events: Array<{
      id: string;
      fromStatus: string | null;
      toStatus: string;
      note: string | null;
      actorName: string | null;
      createdAt: Date | string;
    }>;
  }>;
};

export function QaDetail({
  data,
  canReview,
}: {
  data: Detail;
  canReview: boolean;
}) {
  const { turnover, latestInspection, inspections } = data;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const qaStatus = (latestInspection?.status as QaStatus | undefined) ?? "PENDING";
  const readOnly =
    !canReview ||
    !latestInspection ||
    !["PENDING", "NEEDS_REWORK"].includes(latestInspection.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={qaStatusTone(qaStatus)}>
          {QA_STATUS_LABELS[qaStatus] ?? qaStatus}
        </Badge>
        <Badge tone={priorityTone(turnover.priority)}>{turnover.priority}</Badge>
        <Badge tone="neutral">{statusLabel(turnover.status)}</Badge>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {turnover.property.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {turnover.property.address}, {turnover.property.city} · {turnover.property.unitCode}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/turnovers/${turnover.id}`}>
              <Button variant="outline" size="sm">
                Turnover
              </Button>
            </Link>
            <Link href={`/properties/${turnover.property.id}`}>
              <Button variant="ghost" size="sm">
                Property
              </Button>
            </Link>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Cleaner</dt>
            <dd className="font-medium">{turnover.vendor?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Inspector</dt>
            <dd className="font-medium">
              {latestInspection?.inspectorName ?? "Unclaimed"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Due</dt>
            <dd className="font-medium">{formatDateTime(turnover.deadlineAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Photos</dt>
            <dd className="font-medium">
              {turnover.photosUploaded}/{turnover.photosRequired} · verified{" "}
              {turnover.photosVerified}
            </dd>
          </div>
        </dl>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Linked SOP
            </p>
            {turnover.sop ? (
              <Link href={`/sops/${turnover.sop.id}`} className="font-medium text-[var(--accent)]">
                {turnover.sop.name} · v{turnover.sop.version}
              </Link>
            ) : (
              <p className="text-[var(--muted)]">None</p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Linked SOW
            </p>
            {turnover.sow ? (
              <Link href={`/sows/${turnover.sow.id}`} className="font-medium text-[var(--accent)]">
                {turnover.sow.name} · {turnover.sow.slaMinutes}m SLA
              </Link>
            ) : (
              <p className="text-[var(--muted)]">None</p>
            )}
          </div>
        </div>

        {turnover.notes ? (
          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[var(--surface-2)]/60 px-3 py-2 text-sm text-[var(--muted)]">
            {turnover.notes}
          </p>
        ) : null}

        {canReview && !latestInspection ? (
          <div className="mt-4">
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("turnoverId", turnover.id);
                  const res = await openQaInspectionAction(fd);
                  if (res?.error) setError(res.error);
                  else router.refresh();
                });
              }}
            >
              {pending ? "Opening…" : "Start QA inspection"}
            </Button>
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Cleaner checklist results
        </h2>
        <ul className="mt-3 space-y-1 text-sm">
          {turnover.checklistItems.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {item.section}: {item.title}
              </span>
              <Badge tone={item.completed ? "success" : "warning"}>
                {item.completed ? `Done${item.completedBy ? ` · ${item.completedBy}` : ""}` : "Open"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      {latestInspection ? (
        <>
          <InspectionChecklist
            turnoverId={turnover.id}
            items={latestInspection.items}
            readOnly={readOnly}
          />
          <PhotoReview
            turnoverId={turnover.id}
            photos={latestInspection.photos}
            readOnly={readOnly}
          />
          <QaDecisionPanel
            turnoverId={turnover.id}
            inspection={latestInspection}
            canDecide={canReview}
          />
          {canReview &&
          (latestInspection.items.some((i) => i.result === "FAIL") ||
            latestInspection.photos.some((p) => p.result === "FAIL")) ? (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Create issues from failures
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Open blocking issues for each failed checklist item and photo so ops can track
                resolution.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const fd = new FormData();
                      fd.set("inspectionId", latestInspection.id);
                      fd.set("turnoverId", turnover.id);
                      const res = await createIssuesFromQaAction(fd);
                      if (res?.error) setError(res.error);
                      else router.push(`/issues?propertyId=${turnover.property.id}`);
                    });
                  }}
                >
                  {pending ? "Creating…" : "Create issues from QA failures"}
                </Button>
                <Link href={`/issues?propertyId=${turnover.property.id}`}>
                  <Button type="button" size="sm" variant="ghost">
                    View issues
                  </Button>
                </Link>
              </div>
              {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--muted)]">
          Open an inspection to mark pass/fail items and review photos.
        </div>
      )}

      <ReinspectionHistory inspections={inspections} />
    </div>
  );
}
