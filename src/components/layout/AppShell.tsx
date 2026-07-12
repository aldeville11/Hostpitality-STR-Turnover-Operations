"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Users,
  Camera,
  UserRound,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import { logoutAction } from "@/lib/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/turnovers", label: "Turnovers", icon: ClipboardList },
  { href: "/sops", label: "SOPs", icon: FileText },
  { href: "/sow-templates", label: "SOW Templates", icon: CheckSquare },
  { href: "/assignments", label: "Cleaner Assignments", icon: Users },
  { href: "/qa", label: "QA / Photo Review", icon: Camera },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/owners", label: "Owners / Reporting", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: Role; companyName: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-50/80 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f766e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Hostpitality
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <p className="font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {ROLE_LABELS[user.role]} · {user.companyName}
              </p>
            </div>
            <form action={logoutAction}>
              <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-0 lg:gap-6">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl transition lg:static lg:z-0 lg:mt-4 lg:mb-6 lg:ml-4 lg:h-[calc(100vh-5.5rem)] lg:w-60 lg:rounded-2xl lg:border lg:shadow-none lg:sticky lg:top-[4.5rem]",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-[family-name:var(--font-display)] font-semibold">Menu</span>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-[var(--surface-2)]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-0.5 overflow-y-auto pb-8">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        {open ? (
          <button
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
        ) : null}
        <main className="min-w-0 flex-1 px-4 py-6 lg:pr-6">{children}</main>
      </div>
    </div>
  );
}
