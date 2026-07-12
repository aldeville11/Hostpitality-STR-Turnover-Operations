"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import {
  addPropertyStepAction,
  continuePropertiesAction,
} from "@/lib/onboarding-actions";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { StepCard } from "@/components/onboarding/step-card";
import { Badge } from "@/components/ui";

type PropertyRow = {
  id: string;
  name: string;
  unitCode: string;
  address: string;
  city: string;
  state: string;
};

export function PropertiesStepClient({ properties }: { properties: PropertyRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <StepCard
      title="Properties"
      description="Add the units your team will turn over. You need at least one to activate."
      actions={
        <form
          action={() => {
            setError(null);
            startTransition(async () => {
              const res = await continuePropertiesAction();
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <Button type="submit" disabled={pending || properties.length === 0}>
            Continue
          </Button>
        </form>
      }
    >
      {properties.length === 0 ? (
        <OnboardingEmptyState
          title="No properties yet"
          description="Add your first unit so calendars, SOPs, and turnovers have somewhere to attach."
        />
      ) : (
        <div className="space-y-2">
          {properties.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {p.unitCode} · {p.address}, {p.city}, {p.state}
                </p>
              </div>
              <Badge tone="success">Added</Badge>
            </div>
          ))}
        </div>
      )}

      <form
        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await addPropertyStepAction(fd);
            if (res?.error) setError(res.error);
              else router.refresh();
          });
        }}
      >
        <p className="text-sm font-semibold">Add property</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Harbor View Loft" />
          </div>
          <div>
            <Label htmlFor="unitCode">Unit code</Label>
            <Input id="unitCode" name="unitCode" required placeholder="HVL-101" />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" name="bedrooms" type="number" defaultValue={1} min={0} />
          </div>
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input id="bathrooms" name="bathrooms" type="number" step="0.5" defaultValue={1} min={0} />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save property"}
        </Button>
      </form>
    </StepCard>
  );
}
