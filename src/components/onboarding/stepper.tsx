import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/lib/onboarding";

export function OnboardingStepper({
  current,
  progress,
}: {
  current: OnboardingStepId;
  progress: OnboardingProgress;
}) {
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1">
        {ONBOARDING_STEPS.map((step, index) => {
          const status = progress[step.id];
          const isCurrent = step.id === current;
          const done = status === "complete" || status === "skipped";

          return (
            <li key={step.id} className="flex items-center gap-1">
              <Link
                href={step.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  isCurrent && "bg-[var(--accent)] text-white",
                  !isCurrent && done && "bg-emerald-50 text-emerald-800",
                  !isCurrent && !done && "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink)]"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
                </span>
                <span>
                  {index + 1}. {step.label}
                  {!step.required ? <span className="opacity-70"> · optional</span> : null}
                </span>
              </Link>
              {index < ONBOARDING_STEPS.length - 1 ? (
                <span className="hidden text-[var(--border)] sm:inline">—</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
