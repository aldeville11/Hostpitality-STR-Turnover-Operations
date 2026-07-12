"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, Input, Label } from "@/components/ui";
import { createSopFromTemplateAction } from "@/lib/sop-actions";
import { SOP_TEMPLATES } from "@/lib/sops";
import { unitTypeLabel } from "@/lib/properties";

export function TemplatePicker() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Starter templates
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Duplicate a common rental playbook, then edit rooms, restock, and safety notes.
      </p>

      <div className="mt-4 grid gap-3">
        {SOP_TEMPLATES.map((template) => (
          <form
            key={template.key}
            className="rounded-xl border border-[var(--border)] p-3"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await createSopFromTemplateAction(fd);
                if (res?.error) setError(res.error);
                else router.refresh();
              });
            }}
          >
            <input type="hidden" name="templateKey" value={template.key} />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-[var(--muted)]">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone="info">{unitTypeLabel(template.unitType)}</Badge>
                  <Badge tone="neutral">
                    {template.document.sections.length} sections
                  </Badge>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={pending}>
                Use template
              </Button>
            </div>
            <div className="mt-2">
              <Label htmlFor={`name-${template.key}`}>Optional name</Label>
              <Input
                id={`name-${template.key}`}
                name="name"
                placeholder={template.name}
              />
            </div>
          </form>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
