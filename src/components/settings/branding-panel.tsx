"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBrandingAction } from "@/lib/settings-actions";
import type { CompanySettings } from "@/lib/settings";
import { Button, Input } from "@/components/ui";

export function BrandingPanel({ company }: { company: CompanySettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accent, setAccent] = useState(company.accentColor || "#0F766E");

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Branding
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Brand identity used across admin surfaces and owner-facing summaries.
      </p>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
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
          <label className="mb-1.5 block text-sm font-medium">Brand name</label>
          <Input
            name="brandName"
            defaultValue={company.brandName ?? company.name}
            disabled={pending}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Logo URL</label>
          <Input
            name="logoUrl"
            defaultValue={company.logoUrl ?? ""}
            placeholder="https://…"
            disabled={pending}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Accent color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              disabled={pending}
              className="h-10 w-12 rounded border border-[var(--border)] bg-transparent"
            />
            <Input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Preview</p>
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

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
