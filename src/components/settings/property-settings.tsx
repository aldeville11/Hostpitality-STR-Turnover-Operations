"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePropertyDefaultsAction } from "@/lib/settings-actions";
import { Badge, Button, EmptyState, Input, Label, ModuleCard, Textarea } from "@/components/ui";

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
      <EmptyState
        title="No properties yet"
        description="Add properties first, then configure defaults here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ModuleCard
        title="Property defaults"
        description="Service windows, access notes, turnover preferences, and SLA defaults."
      >
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={
                p.id === selected.id
                  ? "rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard
        key={selected.id}
        title={selected.name}
        description={`${selected.city}${
          selected.defaultVendor ? ` · Default cleaner ${selected.defaultVendor.name}` : ""
        }${selected.sow ? ` · SOW ${selected.sow.name}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{selected.unitCode}</Badge>
            <Badge tone={selected.active ? "success" : "warning"}>
              {selected.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        }
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
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
            <Label htmlFor="accessNotes">Access notes</Label>
            <Textarea
              id="accessNotes"
              name="accessNotes"
              rows={3}
              defaultValue={selected.accessNotes ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="turnoverBufferMins">Turnover buffer (minutes)</Label>
            <Input
              id="turnoverBufferMins"
              name="turnoverBufferMins"
              type="number"
              min={0}
              defaultValue={selected.turnoverBufferMins}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="slaMinutes">Linked SOW SLA (minutes)</Label>
            <Input
              id="slaMinutes"
              name="slaMinutes"
              type="number"
              min={30}
              defaultValue={selected.sow?.slaMinutes ?? 240}
              disabled={pending || !selected.sow}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              name="sameDayTurnover"
              value="1"
              defaultChecked={selected.sameDayTurnover}
              disabled={pending}
            />
            Allow same-day turnovers
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
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

        {message ? <p className="mt-3 text-sm text-[var(--success)]">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      </ModuleCard>
    </div>
  );
}
