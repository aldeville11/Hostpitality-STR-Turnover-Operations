"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { signupAction } from "@/lib/actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,#99f6e4_0%,transparent_40%),radial-gradient(circle_at_90%_20%,#e0f2fe_0%,transparent_35%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">Hostpitality</p>
            <p className="text-xs text-[var(--muted)]">Create your company workspace</p>
          </div>
        </div>

        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await signupAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
          className="space-y-4"
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
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
