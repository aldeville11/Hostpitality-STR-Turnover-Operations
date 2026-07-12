import { redirect } from "next/navigation";
import { getCurrentUser, isOnboarded } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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
