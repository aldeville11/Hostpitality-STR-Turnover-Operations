"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Camera,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Plug,
  Rocket,
  Settings,
  Users,
  X,
  CircleHelp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLockup, BrandMark } from "@/components/brand";
import { can, type Permission } from "@/lib/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission | Permission[];
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const GROUPS: NavGroup[] = [
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { href: "/properties", label: "Properties", icon: Building2, permission: "properties:manage" },
      { href: "/turnovers", label: "Turnovers", icon: ClipboardList, permission: ["turnovers:manage", "turnovers:execute"] },
      { href: "/cleaners", label: "Cleaner Assignments", icon: Users, permission: "assignments:manage" },
      { href: "/inventory", label: "Inventory", icon: Package, permission: "inventory:manage" },
    ],
  },
  {
    id: "quality",
    label: "Quality & Standards",
    items: [
      { href: "/sops", label: "SOPs", icon: FileText, permission: "sops:manage" },
      { href: "/sows", label: "SOW Templates", icon: CheckSquare, permission: "sow:manage" },
      { href: "/qa", label: "QA / Photo Review", icon: Camera, permission: "qa:review" },
      { href: "/issues", label: "Issues", icon: AlertTriangle, permission: "issues:manage" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { href: "/reports", label: "Reporting", icon: BarChart3, permission: ["owners:report", "dashboard:view"] },
      { href: "/integrations", label: "Integrations", icon: Plug, permission: "integrations:manage" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      { href: "/launch", label: "Launch Readiness", icon: Rocket, permission: "settings:manage" },
    ],
  },
];

function itemVisible(role: string, permission: Permission | Permission[]): boolean {
  if (Array.isArray(permission)) {
    return permission.some((p) => can(role, p));
  }
  return can(role, permission);
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
  userName,
  companyName,
  userRole,
  devBypassActive,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  userName: string;
  companyName: string;
  userRole: string;
  devBypassActive?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[var(--surface-sidebar)] text-white transition-[width,transform] duration-[var(--transition)] lg:static lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14",
          collapsed ? "lg:w-[72px]" : "lg:w-[248px]",
          open ? "w-[280px] translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3 lg:hidden">
          <BrandLockup inverted compact />
          <button
            onClick={onClose}
            className="rounded-[var(--radius-md)] p-2 text-white/70 hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden items-center justify-between gap-2 border-b border-white/10 px-3 py-3 lg:flex">
          {collapsed ? (
            <Link href="/dashboard" className="mx-auto" aria-label="Hostpitality home">
              <BrandMark size="sm" />
            </Link>
          ) : (
            <BrandLockup inverted compact />
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-[var(--radius-md)] p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {devBypassActive && !collapsed ? (
          <div className="mx-2 mt-3 rounded-[var(--radius-md)] border border-amber-400/40 bg-amber-500/15 px-2.5 py-2 text-[11px] text-amber-100">
            Development auth bypass active
          </div>
        ) : null}

        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
          {GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => itemVisible(userRole, item.permission));
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.id}>
              {!collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {group.label}
                </p>
              ) : (
                <p className="sr-only">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] font-medium transition-colors duration-[var(--transition)]",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-[var(--accent)] text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        {collapsed ? <span className="sr-only">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-2 py-3">
          <div
            className={cn(
              "mb-2 flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-[12px] text-white/70",
              collapsed && "justify-center"
            )}
            title="System status"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            {!collapsed ? <span>Systems online</span> : null}
          </div>
          <Link
            href="/settings"
            title={collapsed ? "Help & settings" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-[12px] text-white/65 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center"
            )}
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden />
            {!collapsed ? <span>Help & account</span> : null}
          </Link>
          {!collapsed ? (
            <p className="mt-2 truncate px-2.5 text-[11px] text-white/40">
              {userName} · {companyName}
            </p>
          ) : null}
        </div>
      </aside>
      {open ? (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          aria-label="Close menu overlay"
        />
      ) : null}
    </>
  );
}
