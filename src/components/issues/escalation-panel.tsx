"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { escalateIssueAction } from "@/lib/issue-actions";
import {
  formatIssueDateTime,
  issueSeverityLabel,
  type IssueDetail,
} from "@/lib/issues";
import { Badge, Button, Textarea } from "@/components/ui";

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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        SLA & escalation
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Due time, age, and escalation risk for {issueSeverityLabel(issue.severity)} severity.
      </p>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <span className="text-[var(--muted)]">Due </span>
          <span className="font-medium">
            {sla.dueAt ? formatIssueDateTime(sla.dueAt) : "—"}
          </span>
        </div>
        <div>
          <span className="text-[var(--muted)]">Age </span>
          <span className="font-medium">{sla.ageLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted)]">Status </span>
          {sla.isOverdue ? (
            <Badge tone="danger">Overdue</Badge>
          ) : sla.escalationRisk ? (
            <Badge tone="warning">Escalation risk</Badge>
          ) : (
            <Badge tone="success">On track</Badge>
          )}
        </div>
        {issue.escalatedAt ? (
          <div>
            <span className="text-[var(--muted)]">Escalated </span>
            <span className="font-medium">{formatIssueDateTime(issue.escalatedAt)}</span>
          </div>
        ) : null}
      </div>

      {issue.blocking ? (
        <p className="mt-3 rounded-lg border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          Blocking active turnover — resolve before guest arrival.
        </p>
      ) : null}

      {canEscalate ? (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          <label className="mb-1.5 block text-sm font-medium">Escalation reason</label>
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
    </section>
  );
}
