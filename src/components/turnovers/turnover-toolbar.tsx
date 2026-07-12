"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, Select } from "@/components/ui";
import {
  createTurnoverForPropertyAction,
  syncTurnoversAction,
} from "@/lib/turnover-actions";

export function TurnoverToolbar({
  properties,
}: {
  properties: { id: string; name: string; unitCode: string }[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-[family-name:var(--font-display)] text-base font-semibold">
          Create from booking / calendar
        </p>
        <p className="text-sm text-[var(--muted)]">
          Sync connected calendars or open a turnover for a property checkout window.
        </p>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const res = await syncTurnoversAction();
              if (res && "error" in res && res.error) {
                setError(res.error);
                return;
              }
              setMessage(
                res && "count" in res
                  ? `Synced — ${res.count} new turnover${res.count === 1 ? "" : "s"} created`
                  : "Synced"
              );
              router.refresh();
            });
          }}
        >
          {pending ? "Working…" : "Sync calendars"}
        </Button>

        <form
          className="flex flex-wrap items-end gap-2"
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await createTurnoverForPropertyAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <div className="min-w-[200px]">
            <Label htmlFor="propertyId">Property</Label>
            <Select id="propertyId" name="propertyId" required defaultValue="">
              <option value="" disabled>
                Select property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unitCode})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="NORMAL">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <Button type="submit" disabled={pending || properties.length === 0}>
            Create turnover
          </Button>
        </form>
      </div>
    </div>
  );
}
