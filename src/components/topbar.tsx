"use client";

import { Bell, Menu } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions";
import { BrandLockup } from "@/components/brand";
import { StatusBadge } from "@/components/ui/status";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: { name: string; email: string; role: string; companyName: string };
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-3 lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="rounded-[var(--radius-md)] p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <BrandLockup compact />
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
              {user.companyName}
            </p>
            <p className="truncate text-[11px] text-[var(--muted)]">
              Portfolio · All operating regions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <StatusBadge status="healthy" className="hidden sm:inline-flex">
            Env · Dev
          </StatusBadge>
          <button
            type="button"
            className="relative rounded-[var(--radius-md)] border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight text-[var(--text-primary)]">
              {user.name}
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {ROLE_LABELS[user.role as Role] ?? user.role}
            </p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
