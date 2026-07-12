"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Label, Textarea } from "@/components/ui";
import { decideQaAction, setQaOverrideAction } from "@/lib/qa-actions";
import { evaluateApprovalReadiness } from "@/lib/qa";

type Inspection = {
  id: string;
  status: string;
  overrideIncomplete: boolean;
  decisionNote: string | null;
  items: Array<{ result: string; title: string }>;
  photos: Array<{
    result: string;
    required: boolean;
    uploaded: boolean;
    label: string;
  }>;
};

export function QaDecisionPanel({
  turnoverId,
  inspection,
  canDecide,
}: {
  turnoverId: string;
  inspection: Inspection;
  canDecide: boolean;
}) {
  const [note, setNote] = useState(inspection.decisionNote ?? "");
  const [override, setOverride] = useState(inspection.overrideIncomplete);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const readiness = evaluateApprovalReadiness({
    ...inspection,
    overrideIncomplete: override,
  });
  const closed = !["PENDING", "NEEDS_REWORK"].includes(inspection.status);

  function decide(decision: "APPROVED" | "REJECTED" | "NEEDS_REWORK") {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("inspectionId", inspection.id);
      fd.set("turnoverId", turnoverId);
      fd.set("decision", decision);
      fd.set("decisionNote", note);
      if (override) fd.set("overrideIncomplete", "1");
      const res = await decideQaAction(fd);
      if (res?.error) setError(res.error);
      else {
        setMessage(`Marked ${decision.toLowerCase().replace("_", " ")}`);
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        QA decision
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Approve closes the turnover. Reject / needs rework sends it back to the cleaner.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={readiness.canApprove ? "success" : "warning"}>
          {readiness.canApprove ? "Ready to approve" : "Blocked"}
        </Badge>
        {override ? <Badge tone="accent">Override on</Badge> : null}
      </div>

      {readiness.blockers.length > 0 ? (
        <ul className="mt-3 space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
          {readiness.blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}

      {canDecide && !closed ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="decisionNote">Decision note</Label>
            <Textarea
              id="decisionNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Required for reject / rework"
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => {
                const next = e.target.checked;
                setOverride(next);
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("inspectionId", inspection.id);
                  fd.set("turnoverId", turnoverId);
                  if (next) fd.set("overrideIncomplete", "1");
                  await setQaOverrideAction(fd);
                  router.refresh();
                });
              }}
            />
            <span>
              Explicit override — allow approval even if required items failed or photos are
              incomplete
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={pending || (!readiness.canApprove && !override)}
              onClick={() => decide("APPROVED")}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => decide("REJECTED")}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => decide("NEEDS_REWORK")}
            >
              Needs rework
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {closed
            ? `Inspection closed as ${inspection.status}.`
            : "You do not have permission to decide this inspection."}
        </p>
      )}

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
