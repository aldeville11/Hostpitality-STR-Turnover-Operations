"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import { completeOnboardingAction } from "@/lib/actions";

export function OnboardingForm({ companyName }: { companyName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await completeOnboardingAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <p className="text-sm text-[var(--muted)]">
        Setting up <span className="font-medium text-[var(--ink)]">{companyName}</span>
      </p>
      <div>
        <Label htmlFor="propertyName">Property name</Label>
        <Input id="propertyName" name="propertyName" required placeholder="Harbor View Loft" />
      </div>
      <div>
        <Label htmlFor="unitCode">Unit code</Label>
        <Input id="unitCode" name="unitCode" required placeholder="HVL-101" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Complete onboarding"}
      </Button>
    </form>
  );
}
