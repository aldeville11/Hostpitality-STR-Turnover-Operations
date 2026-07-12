"use client";

import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: { name: string; email: string; role: string; companyName: string };
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
            onClick={onMenuClick}
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
              {ROLE_LABELS[user.role as Role] ?? user.role} · {user.companyName}
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
  );
}
