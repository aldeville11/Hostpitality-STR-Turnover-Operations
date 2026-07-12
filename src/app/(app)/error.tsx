"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        message: "app.route_error",
        error: error.message,
        digest: error.digest,
      })
    );
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-rose-950">
        Something went wrong
      </h1>
      <p className="text-sm text-rose-900/80">
        This screen hit an unexpected error. You can retry — if it keeps failing, check Launch
        observability or server logs.
      </p>
      {error.digest ? (
        <p className="font-mono text-[11px] text-rose-800/70">digest {error.digest}</p>
      ) : null}
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
