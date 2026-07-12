"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DetailSection, EmptyState, Input, Label, Select } from "@/components/ui";
import { assignCleanerAction } from "@/lib/turnover-actions";
import { formatDateTime } from "@/lib/utils";

type Vendor = { id: string; name: string; type: string };
type AssignmentEvent = {
  id: string;
  fromName: string | null;
  toName: string | null;
  note: string | null;
  actorName: string | null;
  createdAt: Date | string;
};

export function AssignmentPanel({
  turnoverId,
  currentVendorId,
  currentVendorName,
  vendors,
  history,
}: {
  turnoverId: string;
  currentVendorId: string | null;
  currentVendorName: string | null;
  vendors: Vendor[];
  history: AssignmentEvent[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DetailSection
      title="Cleaner assignment"
      description={`Current: ${currentVendorName ?? "Unassigned"}`}
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await assignCleanerAction(fd);
            if (res?.error) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <input type="hidden" name="id" value={turnoverId} />
        <div>
          <Label htmlFor="vendorId">Assign cleaner / vendor</Label>
          <Select id="vendorId" name="vendorId" defaultValue={currentVendorId ?? ""}>
            <option value="">Unassigned</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.type})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="note">Note</Label>
          <Input id="note" name="note" placeholder="Optional reassignment note" />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save assignment"}
        </Button>
      </form>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Assignment history
        </p>
        {history.length === 0 ? (
          <EmptyState title="No history" description="No assignment changes yet." />
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="neutral">{h.fromName ?? "Unassigned"}</Badge>
                  <span className="text-[var(--text-secondary)]">→</span>
                  <Badge tone="accent">{h.toName ?? "Unassigned"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {formatDateTime(h.createdAt)}
                  {h.actorName ? ` · ${h.actorName}` : ""}
                </p>
                {h.note ? <p className="text-xs text-[var(--text-secondary)]">{h.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DetailSection>
  );
}
