"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DetailSection, EmptyState, Input, Label, Select, StatusBadge, Textarea } from "@/components/ui";
import { ConflictAlert } from "@/components/cleaners/conflict-alert";
import { assignFromCleanersAction } from "@/lib/cleaner-actions";
import type { AssignmentConflict } from "@/lib/cleaners";
import { mapTurnoverStatus } from "@/lib/status-map";
import { formatDateTime, statusLabel } from "@/lib/utils";

type TurnoverOption = {
  id: string;
  property: { name: string; unitCode: string; city: string };
  status: string;
  priority: string;
  windowStart: Date | string;
  deadlineAt: Date | string;
  vendorId?: string | null;
};

export function AssignmentPanel({
  cleanerId,
  cleanerName,
  assignedTurnovers,
  unassignedTurnovers,
}: {
  cleanerId: string;
  cleanerName: string;
  assignedTurnovers: TurnoverOption[];
  unassignedTurnovers: TurnoverOption[];
}) {
  const [turnoverId, setTurnoverId] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);
  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const options = [
    ...unassignedTurnovers.map((t) => ({ ...t, label: "Unassigned" })),
    ...assignedTurnovers
      .filter((t) => t.vendorId && t.vendorId !== cleanerId)
      .map((t) => ({ ...t, label: "Reassign" })),
  ];

  return (
    <DetailSection
      title="Assign / reassign"
      description={`Dispatch upcoming turnovers to ${cleanerName}. Conflicts and SLA risk are checked before save.`}
    >
      <form
        className="space-y-3"
        action={(fd) => {
          setError(null);
          setMessage(null);
          setConflicts([]);
          startTransition(async () => {
            const res = await assignFromCleanersAction(fd);
            if (res && "conflicts" in res && res.conflicts) {
              setConflicts(res.conflicts as AssignmentConflict[]);
            }
            if (res?.error) {
              setError(res.error);
              if (res.requiresOverride) setOverride(true);
              return;
            }
            setMessage("Assignment saved");
            setTurnoverId("");
            setReason("");
            setNote("");
            setOverride(false);
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="vendorId" value={cleanerId} />
        {override ? <input type="hidden" name="manualOverride" value="1" /> : null}

        <div>
          <Label htmlFor="turnoverId">Turnover</Label>
          <Select
            id="turnoverId"
            name="turnoverId"
            value={turnoverId}
            required
            onChange={(e) => setTurnoverId(e.target.value)}
          >
            <option value="">Select turnover</option>
            {options.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.label}] {t.property.name} · {formatDateTime(t.windowStart)} ·{" "}
                {statusLabel(t.status)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="reason">Reason (required for reassignment)</Label>
          <Input
            id="reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Coverage swap, capacity, owner request…"
          />
        </div>
        <div>
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            name="note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional dispatcher note"
          />
        </div>

        {conflicts.length ? <ConflictAlert conflicts={conflicts} /> : null}

        {override ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
            />
            Manual override — assign despite warnings/blocks
          </label>
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !turnoverId}>
            {pending ? "Saving…" : override ? "Override & assign" : "Assign cleaner"}
          </Button>
          {conflicts.length && !override ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOverride(true)}
            >
              Enable override
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Currently assigned
        </p>
        {assignedTurnovers.length === 0 ? (
          <EmptyState title="No assignments" description="No open assignments." />
        ) : (
          <ul className="space-y-2">
            {assignedTurnovers.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t.property.name}{" "}
                    <span className="text-[var(--text-secondary)]">· {t.property.unitCode}</span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatDateTime(t.windowStart)} · due {formatDateTime(t.deadlineAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <StatusBadge status={mapTurnoverStatus(t.status)}>
                    {statusLabel(t.status)}
                  </StatusBadge>
                  <Badge tone={t.priority === "URGENT" || t.priority === "HIGH" ? "danger" : "neutral"}>
                    {t.priority}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DetailSection>
  );
}
