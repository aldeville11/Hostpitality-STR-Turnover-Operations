"use client";

import { Button, Input, Label, Textarea } from "@/components/ui";
import { makeScopeItem, type SowScopeItem } from "@/lib/sows";

export function ScopeItemBuilder({
  items,
  readOnly,
  onChange,
}: {
  items: SowScopeItem[];
  readOnly?: boolean;
  onChange: (items: SowScopeItem[]) => void;
}) {
  function update(id: string, patch: Partial<SowScopeItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Standard scope
          </h2>
          <p className="text-sm text-[var(--muted)]">
            What every turnover includes by default.
          </p>
        </div>
        {!readOnly ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([...items, makeScopeItem()])}
          >
            Add scope item
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No scope items yet. Add the baseline work included in this template.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-[var(--border)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Item {idx + 1}
                </p>
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
              <div className="grid gap-2">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={item.title}
                    disabled={readOnly}
                    onChange={(e) => update(item.id, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={2}
                    value={item.description ?? ""}
                    disabled={readOnly}
                    onChange={(e) => update(item.id, { description: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.required}
                    disabled={readOnly}
                    onChange={(e) => update(item.id, { required: e.target.checked })}
                  />
                  Required in every turnover
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
