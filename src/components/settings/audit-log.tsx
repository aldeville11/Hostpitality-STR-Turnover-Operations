import { Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date | string;
  metadata: Record<string, unknown>;
  user: { id: string; name: string; email: string } | null;
};

export function AuditLogPanel({ logs }: { logs: AuditRow[] }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Audit & security
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Critical changes to settings, users/permissions, and integrations.
      </p>

      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">No admin audit events yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    log.action.includes("disabled") || log.action.includes("failed")
                      ? "danger"
                      : log.action.startsWith("user.")
                        ? "warning"
                        : "info"
                  }
                >
                  {log.action}
                </Badge>
                <span className="text-xs text-[var(--muted)]">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="mt-1">
                <span className="font-medium">{log.entityType}</span>
                {log.entityId ? (
                  <span className="text-[var(--muted)]"> · {log.entityId.slice(0, 12)}…</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {log.user ? `${log.user.name} · ${log.user.email}` : "System"}
              </p>
              {Object.keys(log.metadata).length > 0 ? (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-2)]/60 px-2 py-1.5 text-[11px] text-[var(--muted)]">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
