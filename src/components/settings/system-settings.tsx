"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSystemSettingsAction } from "@/lib/settings-actions";
import type { CompanySettings, SystemSettings } from "@/lib/settings";
import { Button, Input, Label, ModuleCard, Select } from "@/components/ui";

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
    <ModuleCard
      title="System settings"
      description="Categories, SLA thresholds, default templates, and feature flags for the company."
    >
      <form
        className="space-y-5"
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
            <Label htmlFor="issueCategories">Issue categories</Label>
            <Input
              id="issueCategories"
              name="issueCategories"
              defaultValue={settings.issueCategories.join(", ")}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="issueSeverities">Issue severities</Label>
            <Input
              id="issueSeverities"
              name="issueSeverities"
              defaultValue={settings.issueSeverities.join(", ")}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="defaultTurnoverBufferMins">Default turnover buffer (min)</Label>
            <Input
              id="defaultTurnoverBufferMins"
              name="defaultTurnoverBufferMins"
              type="number"
              min={0}
              defaultValue={settings.defaultTurnoverBufferMins}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="defaultSlaMinutes">Default SLA (min)</Label>
            <Input
              id="defaultSlaMinutes"
              name="defaultSlaMinutes"
              type="number"
              min={30}
              defaultValue={settings.defaultSlaMinutes}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="defaultSopId">Default SOP template</Label>
            <Select
              id="defaultSopId"
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
            <Label htmlFor="defaultSowId">Default SOW template</Label>
            <Select
              id="defaultSowId"
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Issue SLA thresholds (hours)
          </p>
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
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Feature flags
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              Object.entries(settings.featureFlags) as Array<
                [keyof SystemSettings["featureFlags"], boolean]
              >
            ).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
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

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Known turnover statuses
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {settings.turnoverStatuses.join(" · ")}
          </p>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save system settings"}
        </Button>
      </form>

      {message ? <p className="mt-3 text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </ModuleCard>
  );
}
