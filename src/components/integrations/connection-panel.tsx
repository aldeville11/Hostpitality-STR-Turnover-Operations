"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  connectIntegrationAction,
  setIntegrationEnabledAction,
  syncIntegrationAction,
} from "@/lib/integration-actions";
import { Button, Input } from "@/components/ui";

export function ConnectionPanel({
  integrationId,
  status,
  enabled,
  externalAccount,
  category,
}: {
  integrationId: string;
  status: string;
  enabled: boolean;
  externalAccount: string | null;
  category: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [account, setAccount] = useState(externalAccount ?? "");

  const connected = status === "CONNECTED" || status === "SYNCING" || status === "ERROR";

  function run(action: () => Promise<{ error?: string; stats?: { created: number; updated: number; skipped: number } } | void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      if (res && "stats" in res && res.stats) {
        setMessage(
          `Sync complete · ${res.stats.created} created · ${res.stats.updated} updated · ${res.stats.skipped} skipped`
        );
      } else {
        setMessage("Updated");
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Connection
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Connect, reconnect, enable/disable, and run a sync for this {category.toLowerCase()}{" "}
        integration.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">External account</label>
          <Input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="ops@example.com"
            disabled={pending}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const fd = new FormData();
                fd.set("integrationId", integrationId);
                fd.set("externalAccount", account);
                return connectIntegrationAction(fd);
              })
            }
          >
            {connected ? "Reconnect" : "Connect"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || (!connected && !enabled)}
            onClick={() =>
              run(async () => {
                const fd = new FormData();
                fd.set("integrationId", integrationId);
                return syncIntegrationAction(fd);
              })
            }
          >
            Run sync
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const fd = new FormData();
                fd.set("integrationId", integrationId);
                fd.set("enabled", enabled ? "0" : "1");
                return setIntegrationEnabledAction(fd);
              })
            }
          >
            {enabled ? "Disable" : "Enable"}
          </Button>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}
