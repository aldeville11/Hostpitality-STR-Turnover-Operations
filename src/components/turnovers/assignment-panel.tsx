"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Label, Select, Input } from "@/components/ui";
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Cleaner assignment
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Current: <span className="font-medium text-[var(--ink)]">{currentVendorName ?? "Unassigned"}</span>
      </p>

      <form
        className="mt-4 space-y-3"
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
          <p className="text-sm text-[var(--muted)]">No assignment changes yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="neutral">{h.fromName ?? "Unassigned"}</Badge>
                  <span className="text-[var(--muted)]">→</span>
                  <Badge tone="accent">{h.toName ?? "Unassigned"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDateTime(h.createdAt)}
                  {h.actorName ? ` · ${h.actorName}` : ""}
                </p>
                {h.note ? <p className="text-xs text-[var(--muted)]">{h.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
