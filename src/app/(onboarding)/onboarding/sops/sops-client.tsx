"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepCard } from "@/components/onboarding/step-card";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { Badge, Button, Input, Label, Textarea } from "@/components/ui";
import { addSopStepAction, continueSopsAction } from "@/lib/onboarding-actions";

type SopRow = { id: string; name: string; description: string | null };

export function SopsStepClient({ sops }: { sops: SopRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <StepCard
      title="SOPs"
      description="Upload a cleaning playbook. One line per checklist item is enough for Phase 2."
      actions={
        <form
          action={() => {
            setError(null);
            startTransition(async () => {
              const res = await continueSopsAction();
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <Button type="submit" disabled={pending || sops.length === 0}>
            Continue
          </Button>
        </form>
      }
    >
      {sops.length === 0 ? (
        <OnboardingEmptyState
          title="No SOPs uploaded"
          description="Create a standard operating procedure so cleaners know the property playbook."
        />
      ) : (
        <div className="space-y-2">
          {sops.map((sop) => (
            <div
              key={sop.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
            >
              <div>
                <p className="font-medium">{sop.name}</p>
                <p className="text-xs text-[var(--muted)]">{sop.description || "No description"}</p>
              </div>
              <Badge tone="success">Ready</Badge>
            </div>
          ))}
        </div>
      )}

      <form
        className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await addSopStepAction(fd);
            if (res?.error) setError(res.error);
              else router.refresh();
          });
        }}
      >
        <p className="text-sm font-semibold">Upload SOP</p>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Standard 2BR Turnover" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Coastal short-term rental playbook" />
        </div>
        <div>
          <Label htmlFor="content">Checklist items (one per line)</Label>
          <Textarea
            id="content"
            name="content"
            rows={5}
            placeholder={"Confirm checkout\nClean kitchen\nRemake beds\nCapture proof photos\nSign off"}
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save SOP"}
        </Button>
      </form>
    </StepCard>
  );
}
