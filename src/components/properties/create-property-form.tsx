"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { createPropertyAction } from "@/lib/property-actions";
import { UNIT_TYPES } from "@/lib/properties";

export function CreatePropertyForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await createPropertyAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Add property</h2>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Harbor View Loft" />
      </div>
      <div>
        <Label htmlFor="unitCode">Unit code</Label>
        <Input id="unitCode" name="unitCode" required placeholder="HVL-101" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required />
        </div>
      </div>
      <div>
        <Label htmlFor="unitType">Unit type</Label>
        <Select id="unitType" name="unitType" defaultValue="apartment">
          {UNIT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="bedrooms">Beds</Label>
          <Input id="bedrooms" name="bedrooms" type="number" defaultValue={1} />
        </div>
        <div>
          <Label htmlFor="bathrooms">Baths</Label>
          <Input id="bathrooms" name="bathrooms" type="number" step="0.5" defaultValue={1} />
        </div>
        <div>
          <Label htmlFor="maxGuests">Guests</Label>
          <Input id="maxGuests" name="maxGuests" type="number" defaultValue={2} />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Create property"}
      </Button>
    </form>
  );
}
