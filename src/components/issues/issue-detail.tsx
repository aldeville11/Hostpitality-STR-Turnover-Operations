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
  type IssueDetailPayload,
  type IssueStatus,
} from "@/lib/issues";
import {
  Badge,
  Button,
  DetailFactGrid,
  DetailSection,
  EmptyState,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { mapIssueSeverity, mapIssueStatus } from "@/lib/status-map";
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
        <StatusBadge status={mapIssueStatus(issue.status)}>
          {ISSUE_STATUS_LABELS[issue.status as IssueStatus] ?? statusLabel(issue.status)}
        </StatusBadge>
        <StatusBadge status={mapIssueSeverity(issue.severity)}>
          {issueSeverityLabel(issue.severity)}
        </StatusBadge>
        <Badge tone="neutral">{issueCategoryLabel(issue.category)}</Badge>
        <Badge tone="info">{issueSourceLabel(issue.source)}</Badge>
        {issue.blocking ? <Badge tone="danger">Blocking</Badge> : null}
        {issue.sla.isOverdue ? <StatusBadge status="at_risk">Overdue</StatusBadge> : null}
        {issue.sla.escalationRisk && !issue.sla.isOverdue ? (
          <StatusBadge status="warning">Escalation risk</StatusBadge>
        ) : null}
      </div>

      <DetailSection title={issue.title}>
        <p className="mb-4 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
          {issue.description}
        </p>
        <DetailFactGrid
          items={[
            {
              label: "Property",
              value: issue.propertyId ? (
                <Link href={`/properties/${issue.propertyId}`} className="hover:underline">
                  {issue.property
                    ? `${issue.property.name} · ${issue.property.unitCode}`
                    : "—"}
                </Link>
              ) : issue.property ? (
                `${issue.property.name} · ${issue.property.unitCode}`
              ) : (
                "—"
              ),
            },
            {
              label: "Turnover",
              value: issue.turnoverId ? (
                <Link href={`/turnovers/${issue.turnoverId}`} className="hover:underline">
                  {issue.turnover ? statusLabel(issue.turnover.status) : "—"}
                </Link>
              ) : (
                "—"
              ),
            },
            {
              label: "QA inspection",
              value:
                issue.turnoverId && issue.qaInspectionId ? (
                  <Link href={`/qa/${issue.turnoverId}`} className="hover:underline">
                    {issue.qaInspection ? statusLabel(issue.qaInspection.status) : "—"}
                  </Link>
                ) : (
                  "—"
                ),
            },
            { label: "Owner", value: issue.ownerName ?? "—" },
            { label: "Assignee", value: issue.assigneeName ?? "Unassigned" },
            { label: "Opened", value: formatIssueDateTime(issue.createdAt) },
            {
              label: "Due",
              value: issue.sla.dueAt ? formatIssueDateTime(issue.sla.dueAt) : "—",
            },
            { label: "Age", value: issue.sla.ageLabel },
          ]}
        />
      </DetailSection>

      {canManage && issue.allowedNextStatuses.length > 0 ? (
        <DetailSection
          title="Workflow"
          description="Advance status through triage, assignment, resolution, verification, and close."
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Transition note
            </label>
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
        </DetailSection>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <DetailSection title="Linked context">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  SOP
                </p>
                {sop ? (
                  <>
                    <p className="font-medium text-[var(--text-primary)]">
                      <Link href={`/sops/${sop.id}`} className="hover:underline">
                        {sop.name}
                      </Link>
                    </p>
                    {sop.description ? (
                      <p className="text-[var(--text-secondary)]">{sop.description}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)]">No SOP linked</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  SOW
                </p>
                {sow ? (
                  <>
                    <p className="font-medium text-[var(--text-primary)]">
                      <Link href={`/sows/${sow.id}`} className="hover:underline">
                        {sow.name}
                      </Link>
                    </p>
                    <p className="text-[var(--text-secondary)]">{sow.standardScope}</p>
                  </>
                ) : (
                  <p className="text-[var(--text-secondary)]">No SOW linked</p>
                )}
              </div>
              {issue.qaInspection && issue.qaInspection.items.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Failed QA items
                  </p>
                  <ul className="mt-1 space-y-1">
                    {issue.qaInspection.items.map((item) => (
                      <li key={item.id} className="text-[var(--text-secondary)]">
                        {item.title}
                        {item.comment ? ` — ${item.comment}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </DetailSection>

          <DetailSection title="Photos">
            {photos.length === 0 && !(issue.qaInspection?.photos?.length) ? (
              <EmptyState title="No photos" description="No photos attached." />
            ) : (
              <ul className="flex flex-wrap gap-2">
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
          </DetailSection>

          {canManage ? (
            <DetailSection
              title="Add update"
              description="Internal comments stay ops-only. External updates can be shared with vendors."
            >
              <div className="space-y-3">
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
            </DetailSection>
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
            <DetailSection title="Assignment">
              <p className="text-sm text-[var(--text-secondary)]">
                Owner {issue.ownerName ?? "—"} · Assignee {issue.assigneeName ?? "Unassigned"}
              </p>
            </DetailSection>
          )}

          <EscalationPanel issue={issue} />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
