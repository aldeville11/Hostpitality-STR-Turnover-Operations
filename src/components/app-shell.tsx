"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; companyName: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-50/80 blur-3xl" />
      </div>

      <Topbar user={user} onMenuClick={() => setOpen(true)} />

      <div className="mx-auto flex max-w-[1400px] gap-0 lg:gap-6">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:pr-6">{children}</main>
      </div>
    </div>
  );
}
