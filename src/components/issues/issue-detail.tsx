"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EscalationPanel } from "@/components/issues/escalation-panel";
import { IssueAssignment } from "@/components/issues/issue-assignment";
import { IssueTimeline } from "@/components/issues/issue-timeline";
import { addIssueCommentAction, updateIssueStatusAction } from "@/lib/issue-actions";
import {
  ISSUE_STATUS_LABELS,
  formatIssueDateTime,
  issueCategoryLabel,
  issueSeverityLabel,
  issueSourceLabel,
  issueStatusTone,
  type IssueDetailPayload,
  type IssueStatus,
} from "@/lib/issues";
import { Badge, Button, Select, Textarea } from "@/components/ui";
import { statusLabel } from "@/lib/utils";

export function IssueDetail({
  data,
  canManage,
}: {
  data: IssueDetailPayload;
  canManage: boolean;
}) {
  const { issue, vendors } = data;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [statusNote, setStatusNote] = useState("");

  const photos = issue.photos ?? [];
  const sop = issue.turnover?.sop ?? issue.property?.sop ?? null;
  const sow = issue.turnover?.sow ?? issue.property?.sow ?? null;

  function transitionTo(status: IssueStatus) {
    setError(null);
    const fd = new FormData();
    fd.set("issueId", issue.id);
    fd.set("status", status);
    if (statusNote.trim()) fd.set("note", statusNote.trim());
    startTransition(async () => {
      const result = await updateIssueStatusAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStatusNote("");
      router.refresh();
    });
  }

  function submitComment() {
    setError(null);
    if (!comment.trim()) {
      setError("Comment required");
      return;
    }
    const fd = new FormData();
    fd.set("issueId", issue.id);
    fd.set("body", comment);
    fd.set("visibility", visibility);
    startTransition(async () => {
      const result = await addIssueCommentAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={issueStatusTone(issue.status)}>
          {ISSUE_STATUS_LABELS[issue.status as IssueStatus] ?? statusLabel(issue.status)}
        </Badge>
        <Badge tone="neutral">{issueSeverityLabel(issue.severity)}</Badge>
        <Badge tone="neutral">{issueCategoryLabel(issue.category)}</Badge>
        <Badge tone="info">{issueSourceLabel(issue.source)}</Badge>
        {issue.blocking ? <Badge tone="danger">Blocking</Badge> : null}
        {issue.sla.isOverdue ? <Badge tone="danger">Overdue</Badge> : null}
        {issue.sla.escalationRisk && !issue.sla.isOverdue ? (
          <Badge tone="warning">Escalation risk</Badge>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {issue.title}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
          {issue.description}
        </p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Meta
            label="Property"
            value={
              issue.property
                ? `${issue.property.name} · ${issue.property.unitCode}`
                : "—"
            }
            href={issue.propertyId ? `/properties/${issue.propertyId}` : undefined}
          />
          <Meta
            label="Turnover"
            value={issue.turnover ? statusLabel(issue.turnover.status) : "—"}
            href={issue.turnoverId ? `/turnovers/${issue.turnoverId}` : undefined}
          />
          <Meta
            label="QA inspection"
            value={
              issue.qaInspection
                ? statusLabel(issue.qaInspection.status)
                : "—"
            }
            href={
              issue.turnoverId && issue.qaInspectionId
                ? `/qa/${issue.turnoverId}`
                : undefined
            }
          />
          <Meta label="Owner" value={issue.ownerName ?? "—"} />
          <Meta label="Assignee" value={issue.assigneeName ?? "Unassigned"} />
          <Meta label="Opened" value={formatIssueDateTime(issue.createdAt)} />
          <Meta label="Due" value={formatIssueDateTime(issue.sla.dueAt)} />
          <Meta label="Age" value={issue.sla.ageLabel} />
        </div>
      </section>

      {canManage && issue.allowedNextStatuses.length > 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Workflow
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Advance status through triage, assignment, resolution, verification, and close.
          </p>
          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium">Transition note</label>
            <Textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={2}
              placeholder="Optional note for this status change"
              disabled={pending}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {issue.allowedNextStatuses.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={
                  status === "CLOSED" || status === "ESCALATED"
                    ? "danger"
                    : status === "RESOLVED" || status === "VERIFIED"
                      ? "primary"
                      : "outline"
                }
                disabled={pending}
                onClick={() => transitionTo(status)}
              >
                {ISSUE_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Linked context
            </h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  SOP
                </p>
                {sop ? (
                  <>
                    <p className="font-medium">
                      <Link href={`/sops/${sop.id}`} className="hover:underline">
                        {sop.name}
                      </Link>
                    </p>
                    {sop.description ? (
                      <p className="text-[var(--muted)]">{sop.description}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[var(--muted)]">No SOP linked</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  SOW
                </p>
                {sow ? (
                  <>
                    <p className="font-medium">
                      <Link href={`/sows/${sow.id}`} className="hover:underline">
                        {sow.name}
                      </Link>
                    </p>
                    <p className="text-[var(--muted)]">{sow.standardScope}</p>
                  </>
                ) : (
                  <p className="text-[var(--muted)]">No SOW linked</p>
                )}
              </div>
              {issue.qaInspection && issue.qaInspection.items.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Failed QA items
                  </p>
                  <ul className="mt-1 space-y-1">
                    {issue.qaInspection.items.map((item) => (
                      <li key={item.id} className="text-[var(--muted)]">
                        {item.title}
                        {item.comment ? ` — ${item.comment}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Photos
            </h2>
            {photos.length === 0 && !(issue.qaInspection?.photos?.length) ? (
              <p className="mt-2 text-sm text-[var(--muted)]">No photos attached.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {photos.map((p) => (
                  <li key={p}>
                    <Badge tone="neutral">{p}</Badge>
                  </li>
                ))}
                {issue.qaInspection?.photos?.map((p) => (
                  <li key={p.id}>
                    <Badge tone="warning">{p.label}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canManage ? (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Add update
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Internal comments stay ops-only. External updates can be shared with vendors.
              </p>
              <div className="mt-3 space-y-3">
                <Select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "INTERNAL" | "EXTERNAL")
                  }
                  disabled={pending}
                >
                  <option value="INTERNAL">Internal comment</option>
                  <option value="EXTERNAL">External update</option>
                </Select>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Add a note…"
                  disabled={pending}
                />
                <Button type="button" onClick={submitComment} disabled={pending}>
                  {pending ? "Saving…" : "Post update"}
                </Button>
              </div>
            </section>
          ) : null}

          <IssueTimeline events={issue.events} comments={issue.comments} />
        </div>

        <div className="space-y-6">
          {canManage ? (
            <IssueAssignment
              issueId={issue.id}
              vendors={vendors.map((v) => ({
                id: v.id,
                label: `${v.name} (${v.type})`,
              }))}
              currentAssigneeVendorId={issue.assigneeVendorId}
              currentOwnerName={issue.ownerName}
            />
          ) : (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Assignment
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Owner {issue.ownerName ?? "—"} · Assignee {issue.assigneeName ?? "Unassigned"}
              </p>
            </section>
          )}

          <EscalationPanel issue={issue} />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

function Meta({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      {href ? (
        <Link href={href} className="mt-1 block text-sm font-medium hover:underline">
          {value}
        </Link>
      ) : (
        <p className="mt-1 text-sm font-medium">{value}</p>
      )}
    </div>
  );
}
