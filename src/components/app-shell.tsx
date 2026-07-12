"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; companyName: string };
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Topbar user={user} onMenuClick={() => setOpen(true)} />
      <div className="flex">
        <Sidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          userName={user.name}
          companyName={user.companyName}
        />
        <main
          className={cn(
            "min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6",
            "max-w-[1600px]"
          )}
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
