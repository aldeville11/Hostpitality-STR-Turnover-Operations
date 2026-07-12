"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { loginAction } from "@/lib/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#99f6e4_0%,transparent_35%),radial-gradient(circle_at_80%_0%,#bae6fd_0%,transparent_30%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">Hostpitality</p>
            <p className="text-xs text-[var(--muted)]">Sign in to your ops workspace</p>
          </div>
        </div>

        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await loginAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="manager@hostpitality.app"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="demo1234"
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          New company?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)]">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
