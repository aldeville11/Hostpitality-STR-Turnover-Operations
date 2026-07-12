"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepCard } from "@/components/onboarding/step-card";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import { addVendorStepAction, continueVendorsAction } from "@/lib/onboarding-actions";

type VendorRow = { id: string; name: string; email: string; type: string; phone: string | null };

export function VendorsStepClient({ vendors }: { vendors: VendorRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <StepCard
      title="Cleaners & vendors"
      description="Add the people who execute turnovers and handle escalations."
      actions={
        <form
          action={() => {
            setError(null);
            startTransition(async () => {
              const res = await continueVendorsAction();
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <Button type="submit" disabled={pending || vendors.length === 0}>
            Continue
          </Button>
        </form>
      }
    >
      {vendors.length === 0 ? (
        <OnboardingEmptyState
          title="No vendors yet"
          description="Add at least one cleaner so the first turnover can be assigned."
        />
      ) : (
        <div className="space-y-2">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
            >
              <div>
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {v.email}
                  {v.phone ? ` · ${v.phone}` : ""}
                </p>
              </div>
              <Badge>{v.type}</Badge>
            </div>
          ))}
        </div>
      )}

      <form
        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await addVendorStepAction(fd);
            if (res?.error) setError(res.error);
              else router.refresh();
          });
        }}
      >
        <p className="text-sm font-semibold">Add cleaner / vendor</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" defaultValue="CLEANER">
              <option value="CLEANER">Cleaner</option>
              <option value="VENDOR">Vendor / Handyman</option>
              <option value="COORDINATOR">Coordinator</option>
            </Select>
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save vendor"}
        </Button>
      </form>
    </StepCard>
  );
}
