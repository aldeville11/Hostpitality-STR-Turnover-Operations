"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Camera,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/turnovers", label: "Turnovers", icon: ClipboardList },
  { href: "/sops", label: "SOPs", icon: FileText },
  { href: "/sows", label: "SOW Templates", icon: CheckSquare },
  { href: "/cleaners", label: "Cleaner Assignments", icon: Users },
  { href: "/qa", label: "QA / Photo Review", icon: Camera },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/reports", label: "Reporting", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl transition lg:static lg:z-0 lg:mt-4 lg:mb-6 lg:ml-4 lg:h-[calc(100vh-5.5rem)] lg:w-60 lg:rounded-2xl lg:border lg:shadow-none lg:sticky lg:top-[4.5rem]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-[family-name:var(--font-display)] font-semibold">Menu</span>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--surface-2)]" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto pb-8">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
          onClick={onClose}
          aria-label="Close menu overlay"
        />
      ) : null}
    </>
  );
}
