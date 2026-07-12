import { redirect } from "next/navigation";
import { getCurrentUser, isAuthBypassAllowed, isOnboarded } from "@/lib/auth";
import { getOnboardingContext, getResumeHref } from "@/lib/onboarding";

/** Dev/demo default landing after temporary auth bypass. */
const BYPASS_NEXT = "/launch";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    if (isAuthBypassAllowed()) {
      redirect(`/api/auth/bypass?next=${encodeURIComponent(BYPASS_NEXT)}`);
    }
    redirect("/login");
  }

  if (!user.companyId) {
    redirect("/signup");
  }

  if (!isOnboarded(user)) {
    const ctx = await getOnboardingContext(user.companyId);
    redirect(getResumeHref(ctx.progress, ctx.company.onboardingStep));
  }

  // In bypass-enabled environments, prefer launch diagnostics as the entry surface.
  if (isAuthBypassAllowed()) {
    redirect(BYPASS_NEXT);
  }

  redirect("/dashboard");
}
