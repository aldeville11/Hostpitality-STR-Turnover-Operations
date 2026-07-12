"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePropertyDefaultsAction } from "@/lib/settings-actions";
import { Badge, Button, Input, Textarea } from "@/components/ui";

type PropertyRow = {
  id: string;
  name: string;
  unitCode: string;
  city: string;
  accessNotes: string | null;
  turnoverBufferMins: number;
  sameDayTurnover: boolean;
  active: boolean;
  sow: { id: string; name: string; slaMinutes: number } | null;
  defaultVendor: { id: string; name: string } | null;
};

export function SettingsPropertyPanel({ properties }: { properties: PropertyRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");

  const selected = properties.find((p) => p.id === selectedId) ?? properties[0];

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--muted)]">
        No properties yet. Add properties first, then configure defaults here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Property defaults
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Service windows, access notes, turnover preferences, and SLA defaults.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={
                p.id === selected.id
                  ? "rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]"
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <section
        key={selected.id}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {selected.name}
          </h3>
          <Badge tone="neutral">{selected.unitCode}</Badge>
          <Badge tone={selected.active ? "success" : "warning"}>
            {selected.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {selected.city}
          {selected.defaultVendor ? ` · Default cleaner ${selected.defaultVendor.name}` : ""}
          {selected.sow ? ` · SOW ${selected.sow.name}` : ""}
        </p>

        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={(fd) => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const res = await updatePropertyDefaultsAction(fd);
              if (res.error) {
                setError(res.error);
                return;
              }
              setMessage("Property defaults saved");
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="propertyId" value={selected.id} />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Access notes</label>
            <Textarea
              name="accessNotes"
              rows={3}
              defaultValue={selected.accessNotes ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Turnover buffer (minutes)
            </label>
            <Input
              name="turnoverBufferMins"
              type="number"
              min={0}
              defaultValue={selected.turnoverBufferMins}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Linked SOW SLA (minutes)
            </label>
            <Input
              name="slaMinutes"
              type="number"
              min={30}
              defaultValue={selected.sow?.slaMinutes ?? 240}
              disabled={pending || !selected.sow}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sameDayTurnover"
              value="1"
              defaultChecked={selected.sameDayTurnover}
              disabled={pending}
            />
            Allow same-day turnovers
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              value="1"
              defaultChecked={selected.active}
              disabled={pending}
            />
            Property active
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save property defaults"}
            </Button>
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>
    </div>
  );
}
