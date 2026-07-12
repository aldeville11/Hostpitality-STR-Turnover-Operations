"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { escalateIssueAction } from "@/lib/issue-actions";
import {
  formatIssueDateTime,
  issueSeverityLabel,
  type IssueDetail,
} from "@/lib/issues";
import { Button, DetailFactGrid, DetailSection, StatusBadge, Textarea } from "@/components/ui";

export function EscalationPanel({ issue }: { issue: IssueDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const sla = issue.sla;
  const canEscalate =
    issue.status !== "CLOSED" &&
    issue.status !== "VERIFIED" &&
    issue.status !== "ESCALATED";

  function onEscalate() {
    setError(null);
    const fd = new FormData();
    fd.set("issueId", issue.id);
    fd.set("note", reason);
    startTransition(async () => {
      const result = await escalateIssueAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  return (
    <DetailSection
      title="SLA & escalation"
      description={`Due time, age, and escalation risk for ${issueSeverityLabel(issue.severity)} severity.`}
    >
      <DetailFactGrid
        items={[
          {
            label: "Due",
            value: sla.dueAt ? formatIssueDateTime(sla.dueAt) : "—",
          },
          { label: "Age", value: sla.ageLabel },
          {
            label: "Status",
            value: sla.isOverdue ? (
              <StatusBadge status="at_risk">Overdue</StatusBadge>
            ) : sla.escalationRisk ? (
              <StatusBadge status="warning">Escalation risk</StatusBadge>
            ) : (
              <StatusBadge status="healthy">On track</StatusBadge>
            ),
          },
          ...(issue.escalatedAt
            ? [
                {
                  label: "Escalated",
                  value: formatIssueDateTime(issue.escalatedAt),
                },
              ]
            : []),
        ]}
      />

      {issue.blocking ? (
        <p className="mt-3 rounded-[var(--radius-md)] border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Blocking active turnover — resolve before guest arrival.
        </p>
      ) : null}

      {canEscalate ? (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Escalation reason
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why this needs escalation"
            disabled={pending}
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="button" variant="secondary" onClick={onEscalate} disabled={pending}>
            {pending ? "Escalating…" : "Escalate issue"}
          </Button>
        </div>
      ) : null}
    </DetailSection>
  );
}
