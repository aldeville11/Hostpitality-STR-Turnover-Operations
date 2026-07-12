import { redirect } from "next/navigation";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import { getOnboardingContext, getResumeHref } from "@/lib/onboarding";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.companyId) {
    redirect("/signup");
  }

  if (!isOnboarded(user)) {
    const ctx = await getOnboardingContext(user.companyId);
    redirect(getResumeHref(ctx.progress, ctx.company.onboardingStep));
  }

  redirect("/dashboard");
}
