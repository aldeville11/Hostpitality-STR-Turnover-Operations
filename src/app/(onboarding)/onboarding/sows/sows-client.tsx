"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepCard } from "@/components/onboarding/step-card";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { addSowStepAction, continueSowsAction } from "@/lib/onboarding-actions";

type SowRow = { id: string; name: string; standardScope: string; slaMinutes: number };

export function SowsStepClient({ sows }: { sows: SowRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <StepCard
      title="SOW templates"
      description="Define the standard scope of work, SLA, and optional add-ons for turnovers."
      actions={
        <form
          action={() => {
            setError(null);
            startTransition(async () => {
              const res = await continueSowsAction();
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <Button type="submit" disabled={pending || sows.length === 0}>
            Continue
          </Button>
        </form>
      }
    >
      {sows.length === 0 ? (
        <OnboardingEmptyState
          title="No SOW templates"
          description="Create a scope template so each turnover has clear work boundaries and timing."
        />
      ) : (
        <div className="space-y-2">
          {sows.map((sow) => (
            <div
              key={sow.id}
              className="rounded-xl border border-[var(--border)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{sow.name}</p>
                <Badge tone="info">{sow.slaMinutes}m SLA</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">{sow.standardScope}</p>
            </div>
          ))}
        </div>
      )}

      <form
        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await addSowStepAction(fd);
            if (res?.error) setError(res.error);
              else router.refresh();
          });
        }}
      >
        <p className="text-sm font-semibold">Create SOW template</p>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Standard Turnover SOW" />
        </div>
        <div>
          <Label htmlFor="standardScope">Standard scope</Label>
          <Textarea
            id="standardScope"
            name="standardScope"
            required
            rows={3}
            placeholder="Full clean, linen change, restock, photo proof, walkthrough."
          />
        </div>
        <div>
          <Label htmlFor="addOns">Add-ons (one per line)</Label>
          <Textarea id="addOns" name="addOns" rows={3} placeholder={"Rush turnover\nPet treatment"} />
        </div>
        <div>
          <Label htmlFor="slaMinutes">SLA (minutes)</Label>
          <Input id="slaMinutes" name="slaMinutes" type="number" defaultValue={240} min={30} />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save SOW template"}
        </Button>
      </form>
    </StepCard>
  );
}
