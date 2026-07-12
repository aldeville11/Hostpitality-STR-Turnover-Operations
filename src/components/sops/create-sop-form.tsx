"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { createBlankSopAction } from "@/lib/sop-actions";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";

export function CreateSopForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Create blank SOP
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Start with starter sections, then customize rooms and checklists.
      </p>
      <form
        className="mt-4 space-y-3"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await createBlankSopAction(fd);
            if (res?.error) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Coastal 2BR playbook" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Property-specific turnover instructions"
          />
        </div>
        <div>
          <Label htmlFor="unitType">Rental type</Label>
          <Select id="unitType" name="unitType" defaultValue="apartment">
            {UNIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {unitTypeLabel(t)}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create SOP"}
        </Button>
      </form>
    </section>
  );
}
