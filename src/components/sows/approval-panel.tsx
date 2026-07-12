"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import {
  activateSowAction,
  approveSowAction,
  submitSowReviewAction,
} from "@/lib/sow-actions";
import { STATUS_LABELS, type SowStatus } from "@/lib/sows";
import { formatDateTime } from "@/lib/utils";

export function ApprovalPanel({
  sowId,
  status,
  approvedAt,
  approvedByName,
  canManage,
  buildPayload,
}: {
  sowId: string;
  status: string;
  approvedAt: Date | string | null;
  approvedByName: string | null;
  canManage: boolean;
  buildPayload: () => FormData;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(
    action: (fd: FormData) => Promise<{ error?: string; ok?: boolean } | void>,
    successMsg: string
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const fd = buildPayload();
      fd.set("sowId", sowId);
      const res = await action(fd);
      if (res && "error" in res && res.error) setError(res.error);
      else {
        setMessage(successMsg);
        router.refresh();
      }
    });
  }

  const sowStatus = status as SowStatus;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Approval flow
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Draft → pending review → approved → active. Approvals are logged for audit.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          tone={
            sowStatus === "ACTIVE"
              ? "success"
              : sowStatus === "APPROVED"
                ? "accent"
                : sowStatus === "PENDING_REVIEW"
                  ? "info"
                  : sowStatus === "DRAFT"
                    ? "warning"
                    : "neutral"
          }
        >
          {STATUS_LABELS[sowStatus] ?? status}
        </Badge>
        {approvedByName ? (
          <p className="text-xs text-[var(--muted)]">
            Approved by {approvedByName}
            {approvedAt ? ` · ${formatDateTime(approvedAt)}` : ""}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)]">Not yet approved</p>
        )}
      </div>

      {canManage && status !== "ARCHIVED" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {["DRAFT", "APPROVED"].includes(status) ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(submitSowReviewAction, "Submitted for review")}
            >
              Submit for review
            </Button>
          ) : null}
          {["PENDING_REVIEW", "DRAFT"].includes(status) ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => run(approveSowAction, "Approved")}
            >
              Approve
            </Button>
          ) : null}
          {status === "APPROVED" || status === "ACTIVE" ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => run(activateSowAction, "Activated")}
            >
              {status === "ACTIVE" ? "Re-publish active" : "Activate"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
