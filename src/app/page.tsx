import { redirect } from "next/navigation";
import { getCurrentUser, isOnboarded } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isOnboarded(user)) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
