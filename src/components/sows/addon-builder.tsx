"use client";

import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { makeAddOn, type SowAddOn } from "@/lib/sows";

export function AddonBuilder({
  items,
  readOnly,
  onChange,
}: {
  items: SowAddOn[];
  readOnly?: boolean;
  onChange: (items: SowAddOn[]) => void;
}) {
  function update(id: string, patch: Partial<SowAddOn>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Optional add-ons
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Billable or conditional work outside the standard scope.
          </p>
        </div>
        {!readOnly ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([...items, makeAddOn()])}
          >
            Add add-on
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No add-ons yet. Add optional services like pet treatment or rush turnovers.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Add-on {idx + 1}
                  </p>
                  {item.requiresApproval ? <Badge tone="warning">Needs approval</Badge> : null}
                </div>
                {!readOnly ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={item.name}
                    disabled={readOnly}
                    onChange={(e) => update(item.id, { name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={item.description ?? ""}
                    disabled={readOnly}
                    onChange={(e) => update(item.id, { description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Price note</Label>
                  <Input
                    value={item.priceNote ?? ""}
                    disabled={readOnly}
                    placeholder="+$45 / quote"
                    onChange={(e) => update(item.id, { priceNote: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.requiresApproval}
                      disabled={readOnly}
                      onChange={(e) =>
                        update(item.id, { requiresApproval: e.target.checked })
                      }
                    />
                    Requires approval before use
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
