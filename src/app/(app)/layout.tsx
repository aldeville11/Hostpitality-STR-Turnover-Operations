import { redirect } from "next/navigation";
import { getCurrentUser, isAuthBypassAllowed, isOnboarded } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    if (isAuthBypassAllowed()) {
      redirect("/api/auth/bypass?next=/launch");
    }
    redirect("/login");
  }
  if (!isOnboarded(user)) redirect("/onboarding");

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company?.name ?? "Company",
      }}
    >
      {children}
    </AppShell>
  );
}
