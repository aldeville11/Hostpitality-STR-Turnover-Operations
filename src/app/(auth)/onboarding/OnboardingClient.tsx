"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { completeOnboardingAction, registerCompanyAction } from "@/lib/actions";

export function OnboardingClient({ initialStep }: { initialStep: "company" | "setup" }) {
  const [step, setStep] = useState<"company" | "setup">(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative min-h-screen bg-[var(--bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#99f6e4_0%,transparent_40%),radial-gradient(circle_at_90%_20%,#e0f2fe_0%,transparent_35%)]" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Hostpitality
            </span>
          </div>
          <Link href="/login" className="text-sm text-[var(--muted)]">
            Sign in
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Onboarding
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Create company → add property → import calendar → upload SOP → define SOW → add
            cleaners → activate first turnover.
          </p>
          <div className="mt-4 flex gap-2">
            {["Company", "Activate workflow"].map((label, i) => (
              <div
                key={label}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  (step === "company" && i === 0) || (step === "setup" && i === 1)
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white text-[var(--muted)]"
                }`}
              >
                {i + 1}. {label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white/90 p-6 backdrop-blur">
          {step === "company" ? (
            <form
              className="space-y-4"
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const res = await registerCompanyAction(fd);
                  if (res?.error) setError(res.error);
                  else setStep("setup");
                });
              }}
            >
              <div>
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" name="companyName" required placeholder="Pacific Stay Ops" />
              </div>
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" name="name" required placeholder="Alex Rivera" />
              </div>
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating…" : "Create company"}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const res = await completeOnboardingAction(fd);
                  if (res?.error) setError(res.error);
                });
              }}
            >
              <p className="text-sm font-semibold text-[var(--accent)]">
                2–7. Property through first turnover
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="propertyName">Property name</Label>
                  <Input id="propertyName" name="propertyName" required placeholder="Harbor View Loft" />
                </div>
                <div>
                  <Label htmlFor="unitCode">Unit code</Label>
                  <Input id="unitCode" name="unitCode" required placeholder="HVL-101" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
                </div>
              </div>
              <div>
                <Label htmlFor="calendarUrl">Calendar URL (optional ICS)</Label>
                <Input id="calendarUrl" name="calendarUrl" placeholder="https://…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sopName">SOP name</Label>
                  <Input id="sopName" name="sopName" defaultValue="Standard Turnover SOP" />
                </div>
                <div>
                  <Label htmlFor="sowName">SOW template name</Label>
                  <Input id="sowName" name="sowName" defaultValue="Standard SOW" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cleanerName">Cleaner name</Label>
                  <Input id="cleanerName" name="cleanerName" required />
                </div>
                <div>
                  <Label htmlFor="cleanerEmail">Cleaner email</Label>
                  <Input id="cleanerEmail" name="cleanerEmail" type="email" required />
                </div>
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Activating…" : "Activate first turnover workflow"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
