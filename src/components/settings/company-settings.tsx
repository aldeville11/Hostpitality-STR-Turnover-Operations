"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateCompanyProfileAction,
  updateNotificationsAction,
} from "@/lib/settings-actions";
import type { CompanySettings } from "@/lib/settings";
import { Button, Input, Select } from "@/components/ui";

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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Company profile
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Legal/operating name, timezone, and default contact details.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={(fd) => run(updateCompanyProfileAction, fd)}
        >
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Company name</label>
            <Input name="name" defaultValue={company.name} required disabled={pending} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Timezone</label>
            <Select name="timezone" defaultValue={company.timezone} disabled={pending}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Primary contact</label>
            <Input
              name="contactName"
              defaultValue={company.contactName ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Support email</label>
            <Input
              name="supportEmail"
              type="email"
              defaultValue={company.supportEmail ?? ""}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Support phone</label>
            <Input
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
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Notifications & working hours
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Control which events notify the team and when ops is considered on duty.
        </p>
        <form
          className="mt-4 space-y-4"
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
              <label key={key} className="flex items-center gap-2 text-sm">
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
              <label className="mb-1.5 block text-sm font-medium">Hours timezone</label>
              <Select
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
              <label className="mb-1.5 block text-sm font-medium">Start</label>
              <Input
                name="start"
                type="time"
                defaultValue={company.workingHours.start}
                disabled={pending}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">End</label>
              <Input
                name="end"
                type="time"
                defaultValue={company.workingHours.end}
                disabled={pending}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Working days</p>
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
                        ? "rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white"
                        : "rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)]"
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
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
