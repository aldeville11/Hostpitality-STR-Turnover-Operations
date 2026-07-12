"use client";

import { usePathname } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import {
  ONBOARDING_STEPS,
  type OnboardingProgress,
  type OnboardingStepId,
} from "@/lib/onboarding";

export function OnboardingStepperClient({ progress }: { progress: OnboardingProgress }) {
  const pathname = usePathname();
  const match = ONBOARDING_STEPS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  const current = (match?.id ?? "company") as OnboardingStepId;

  return <OnboardingStepper current={current} progress={progress} />;
}
