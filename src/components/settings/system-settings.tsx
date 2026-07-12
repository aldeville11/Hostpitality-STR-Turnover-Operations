"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSystemSettingsAction } from "@/lib/settings-actions";
import type { CompanySettings, SystemSettings } from "@/lib/settings";
import { Button, Input, Select } from "@/components/ui";

export function SystemSettingsForm({
  company,
  sops,
  sows,
}: {
  company: CompanySettings;
  sops: Array<{ id: string; name: string; status: string }>;
  sows: Array<{ id: string; name: string; status: string; slaMinutes: number }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const settings = company.systemSettings;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        System settings
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Categories, SLA thresholds, default templates, and feature flags for the company.
      </p>

      <form
        className="mt-4 space-y-5"
        action={(fd) => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const res = await updateSystemSettingsAction(fd);
            if (res.error) {
              setError(res.error);
              return;
            }
            setMessage("System settings saved");
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="currentJson" value={JSON.stringify(settings)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Issue categories</label>
            <Input
              name="issueCategories"
              defaultValue={settings.issueCategories.join(", ")}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Issue severities</label>
            <Input
              name="issueSeverities"
              defaultValue={settings.issueSeverities.join(", ")}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Default turnover buffer (min)
            </label>
            <Input
              name="defaultTurnoverBufferMins"
              type="number"
              min={0}
              defaultValue={settings.defaultTurnoverBufferMins}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default SLA (min)</label>
            <Input
              name="defaultSlaMinutes"
              type="number"
              min={30}
              defaultValue={settings.defaultSlaMinutes}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default SOP template</label>
            <Select
              name="defaultSopId"
              defaultValue={settings.defaultSopId ?? ""}
              disabled={pending}
            >
              <option value="">None</option>
              {sops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Default SOW template</label>
            <Select
              name="defaultSowId"
              defaultValue={settings.defaultSowId ?? ""}
              disabled={pending}
            >
              <option value="">None</option>
              {sows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.slaMinutes}m
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Issue SLA thresholds (hours)</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {(
              [
                ["slaCritical", "CRITICAL", settings.slaHoursBySeverity.CRITICAL],
                ["slaHigh", "HIGH", settings.slaHoursBySeverity.HIGH],
                ["slaMedium", "MEDIUM", settings.slaHoursBySeverity.MEDIUM],
                ["slaLow", "LOW", settings.slaHoursBySeverity.LOW],
              ] as const
            ).map(([name, label, value]) => (
              <div key={name}>
                <label className="mb-1.5 block text-xs text-[var(--muted)]">{label}</label>
                <Input
                  name={name}
                  type="number"
                  min={1}
                  defaultValue={value}
                  disabled={pending}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Feature flags</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              Object.entries(settings.featureFlags) as Array<
                [keyof SystemSettings["featureFlags"], boolean]
              >
            ).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`flag_${key}`}
                  value="1"
                  defaultChecked={value}
                  disabled={pending}
                />
                {key}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Known turnover statuses</p>
          <p className="text-sm text-[var(--muted)]">
            {settings.turnoverStatuses.join(" · ")}
          </p>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save system settings"}
        </Button>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
