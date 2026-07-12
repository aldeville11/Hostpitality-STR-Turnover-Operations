"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateCompanyProfileAction,
  updateNotificationsAction,
} from "@/lib/settings-actions";
import type { CompanySettings } from "@/lib/settings";
import { Button, Input, Label, ModuleCard, Select } from "@/components/ui";

const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Phoenix",
  "Pacific/Honolulu",
];

const DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

export function CompanySettingsForm({ company }: { company: CompanySettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [days, setDays] = useState(company.workingHours.days);

  function run(
    action: (fd: FormData) => Promise<{ error?: string }>,
    fd: FormData
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMessage("Saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ModuleCard
        title="Company profile"
        description="Legal/operating name, timezone, and default contact details."
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => run(updateCompanyProfileAction, fd)}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="company-name" required>
              Company name
            </Label>
            <Input
              id="company-name"
              name="name"
              defaultValue={company.name}
              required
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              id="timezone"
              name="timezone"
              defaultValue={company.timezone}
              disabled={pending}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="contactName">Primary contact</Label>
            <Input
              id="contactName"
              name="contactName"
              defaultValue={company.contactName ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              defaultValue={company.supportEmail ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="supportPhone">Support phone</Label>
            <Input
              id="supportPhone"
              name="supportPhone"
              defaultValue={company.supportPhone ?? ""}
              disabled={pending}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save company profile"}
            </Button>
          </div>
        </form>
      </ModuleCard>

      <ModuleCard
        title="Notifications & working hours"
        description="Control which events notify the team and when ops is considered on duty."
      >
        <form
          className="space-y-4"
          action={(fd) => {
            fd.set("days", days.join(","));
            run(updateNotificationsAction, fd);
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["emailAssignments", "Email on cleaner assignment"],
                ["emailQaOutcomes", "Email on QA outcomes"],
                ["emailIssueUpdates", "Email on issue updates"],
                ["smsUrgentOnly", "SMS for urgent / escalated only"],
                ["digestDaily", "Daily digest email"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  name={key}
                  value="1"
                  defaultChecked={company.notificationPrefs[key]}
                  disabled={pending}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="hours-timezone">Hours timezone</Label>
              <Select
                id="hours-timezone"
                name="timezone"
                defaultValue={company.workingHours.timezone || company.timezone}
                disabled={pending}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                name="start"
                type="time"
                defaultValue={company.workingHours.start}
                disabled={pending}
              />
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                name="end"
                type="time"
                defaultValue={company.workingHours.end}
                disabled={pending}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Working days
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const on = days.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      setDays((prev) =>
                        on ? prev.filter((d) => d !== day.id) : [...prev, day.id]
                      )
                    }
                    className={
                      on
                        ? "rounded-[var(--radius-md)] bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white"
                        : "rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save notifications & hours"}
          </Button>
        </form>
      </ModuleCard>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
