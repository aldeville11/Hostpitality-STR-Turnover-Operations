import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";
import {
  ONBOARDING_STEPS,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/lib/onboarding";

function stepStatusBadge(
  status: OnboardingProgress[OnboardingStepId],
  required: boolean
) {
  if (status === "complete") {
    return <StatusBadge status="complete">Done</StatusBadge>;
  }
  if (status === "skipped") {
    return <StatusBadge status="pending">Skipped</StatusBadge>;
  }
  if (required) {
    return <StatusBadge status="needs_review">Required</StatusBadge>;
  }
  return <StatusBadge status="pending">Optional</StatusBadge>;
}

export function OnboardingStepper({
  current,
  progress,
}: {
  current: OnboardingStepId;
  progress: OnboardingProgress;
}) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = progress[step.id];
          const isCurrent = step.id === current;
          const done = status === "complete" || status === "skipped";

          return (
            <li key={step.id} className="flex items-center gap-2">
              <Link
                href={step.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-semibold transition-colors",
                  isCurrent &&
                    "border-[var(--accent)] bg-[var(--accent)] text-white",
                  !isCurrent &&
                    done &&
                    "border-emerald-200/80 bg-[var(--success-soft)] text-[var(--success)]",
                  !isCurrent &&
                    !done &&
                    "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center" aria-hidden>
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  )}
                </span>
                <span>
                  {index + 1}. {step.label}
                </span>
                {!isCurrent ? (
                  <span className="hidden sm:inline">{stepStatusBadge(status, step.required)}</span>
                ) : null}
              </Link>
              {index < ONBOARDING_STEPS.length - 1 ? (
                <span className="hidden text-[var(--border)] sm:inline" aria-hidden>
                  —
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
