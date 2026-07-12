"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import { BrandMark } from "@/components/brand";
import { loginAction } from "@/lib/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
              Hostpitality
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Property Operations Platform</p>
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
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
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
