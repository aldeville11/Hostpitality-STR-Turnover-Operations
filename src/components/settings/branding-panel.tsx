"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBrandingAction } from "@/lib/settings-actions";
import type { CompanySettings } from "@/lib/settings";
import { Button, Input, Label, ModuleCard } from "@/components/ui";

export function BrandingPanel({ company }: { company: CompanySettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accent, setAccent] = useState(company.accentColor || "#0F766E");

  return (
    <ModuleCard
      title="Branding"
      description="Brand identity used across admin surfaces and owner-facing summaries."
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        action={(fd) => {
          setError(null);
          setMessage(null);
          fd.set("accentColor", accent);
          startTransition(async () => {
            const res = await updateBrandingAction(fd);
            if (res.error) {
              setError(res.error);
              return;
            }
            setMessage("Branding saved");
            router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="brandName">Brand name</Label>
          <Input
            id="brandName"
            name="brandName"
            defaultValue={company.brandName ?? company.name}
            disabled={pending}
          />
        </div>
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            name="logoUrl"
            defaultValue={company.logoUrl ?? ""}
            placeholder="https://…"
            disabled={pending}
          />
        </div>
        <div>
          <Label htmlFor="accentColor">Accent color</Label>
          <div className="flex items-center gap-2">
            <input
              id="accentColor"
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              disabled={pending}
              className="h-10 w-12 rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent"
            />
            <Input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Preview
          </p>
          <p
            className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold"
            style={{ color: accent }}
          >
            {company.brandName || company.name}
          </p>
          <div
            className="mt-3 h-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save branding"}
          </Button>
        </div>
      </form>

      {message ? <p className="mt-3 text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </ModuleCard>
  );
}
