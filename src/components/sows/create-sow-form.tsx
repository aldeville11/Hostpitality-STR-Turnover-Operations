"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { createBlankSowAction } from "@/lib/sow-actions";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";

export function CreateSowForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Create SOW template
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Start with standard scope, add-ons, photo proof, SLA, and approval gates.
      </p>
      <form
        className="mt-4 space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await createBlankSowAction(fd);
            if (res?.error) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Standard 2BR turnover SOW" />
        </div>
        <div>
          <Label htmlFor="useCase">Default use case</Label>
          <Input id="useCase" name="useCase" placeholder="Standard turnover" defaultValue="Standard turnover" />
        </div>
        <div>
          <Label htmlFor="propertyGroup">Property group</Label>
          <Input id="propertyGroup" name="propertyGroup" placeholder="Optional group label" />
        </div>
        <div>
          <Label htmlFor="unitType">Unit type</Label>
          <Select id="unitType" name="unitType" defaultValue="apartment">
            {UNIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {unitTypeLabel(t)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} placeholder="Scope notes" />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create template"}
        </Button>
      </form>
    </section>
  );
}
