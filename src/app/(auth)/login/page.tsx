import { redirect } from "next/navigation";
import { isAuthBypassAllowed } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  if (isAuthBypassAllowed()) {
    redirect("/api/auth/bypass?next=/launch");
  }

  return <LoginForm />;
}
