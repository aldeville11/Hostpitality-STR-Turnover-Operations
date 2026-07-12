"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignIssueAction } from "@/lib/issue-actions";
import { Button, Select } from "@/components/ui";

type Option = { id: string; label: string };

export function IssueAssignment({
  issueId,
  vendors,
  currentAssigneeVendorId,
  currentOwnerName,
}: {
  issueId: string;
  vendors: Option[];
  currentAssigneeVendorId: string | null;
  currentOwnerName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState(currentAssigneeVendorId ?? "");

  function onAssign() {
    setError(null);
    const fd = new FormData();
    fd.set("issueId", issueId);
    fd.set("assigneeVendorId", vendorId);
    startTransition(async () => {
      const result = await assignIssueAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Assignment
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Owner and vendor assignee for this issue.
      </p>

      <div className="mt-4 space-y-3">
        <div className="text-sm">
          <span className="text-[var(--muted)]">Owner: </span>
          <span className="font-medium">{currentOwnerName ?? "—"}</span>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Assignee</label>
          <Select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            disabled={pending}
          >
            <option value="">Unassigned</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="button" onClick={onAssign} disabled={pending}>
          {pending ? "Updating…" : "Update assignment"}
        </Button>
      </div>
    </section>
  );
}
