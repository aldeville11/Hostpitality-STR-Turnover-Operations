import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Camera, ClipboardCheck, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#99f6e4_0%,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#bae6fd_0%,_transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230f766e' fill-opacity='1'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-[var(--bg)]/75 to-[var(--bg)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              Hostpitality
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
            >
              Start onboarding
            </Link>
          </div>
        </nav>

        <main className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent-strong)] backdrop-blur">
            AI-powered turnover operations
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Hostpitality
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            Coordinate STR cleaning turnovers—from SOP playbooks and cleaner dispatch to photo
            verification, issue escalation, and owner reporting—in one ops system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              Enter workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/80 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white"
            >
              Create company
            </Link>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "SOP + SOW execution",
                text: "Property playbooks and scoped work with SLAs.",
              },
              {
                icon: Camera,
                title: "Photo-backed QA",
                text: "Required proofs verified before closeout.",
              },
              {
                icon: ShieldCheck,
                title: "Approved AI actions",
                text: "Agents propose; humans approve every mutation.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 backdrop-blur"
              >
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
