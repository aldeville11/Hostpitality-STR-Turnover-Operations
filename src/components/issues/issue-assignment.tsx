"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignIssueAction } from "@/lib/issue-actions";
import { Button, DetailSection, Select } from "@/components/ui";

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
    <DetailSection
      title="Assignment"
      description="Owner and vendor assignee for this issue."
    >
      <div className="space-y-3">
        <div className="text-sm">
          <span className="text-[var(--text-secondary)]">Owner: </span>
          <span className="font-medium text-[var(--text-primary)]">
            {currentOwnerName ?? "—"}
          </span>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Assignee
          </label>
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
    </DetailSection>
  );
}
