"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import {
  repairIntegrityAction,
  retryFailedJobsAction,
  runSmokeTestsAction,
} from "@/lib/launch-actions";

export function LaunchPageHeader({
  ready,
  scorePct,
  validatedAtLabel,
  ownerName,
}: {
  ready: boolean;
  scorePct: number;
  validatedAtLabel: string;
  ownerName: string;
}) {
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function runFullValidation() {
    start(async () => {
      const [smoke, repair, retry] = await Promise.all([
        runSmokeTestsAction(),
        repairIntegrityAction(),
        retryFailedJobsAction(),
      ]);
      setNote(
        [smoke.message, repair.message, retry.message].filter(Boolean).join(" · ")
      );
      window.location.reload();
    });
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Launch Readiness"
        description="Validate operational controls, data integrity, integrations, and automation health before enabling production service."
        meta={
          <>
            <span>
              Status:{" "}
              <StatusBadge status={ready ? "healthy" : "failed"}>
                {ready ? "Ship-ready" : "Needs attention"}
              </StatusBadge>
            </span>
            <span>Readiness: {scorePct}%</span>
            <span>Last validated: {validatedAtLabel}</span>
            <span>Owner: {ownerName}</span>
          </>
        }
        actions={
          <div className="relative flex flex-wrap gap-2">
            <Button type="button" disabled={pending} onClick={runFullValidation}>
              {pending ? "Validating…" : "Run full validation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              More actions
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {menuOpen ? (
              <div
                className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-sm)]"
                role="menu"
              >
                <Link
                  href="/settings/audit"
                  className="block px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
                  role="menuitem"
                >
                  View audit history
                </Link>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
                  role="menuitem"
                  onClick={() => {
                    window.print();
                    setMenuOpen(false);
                  }}
                >
                  Export readiness report
                </button>
              </div>
            ) : null}
          </div>
        }
      />
      {note ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          {note}
        </p>
      ) : null}
    </div>
  );
}
