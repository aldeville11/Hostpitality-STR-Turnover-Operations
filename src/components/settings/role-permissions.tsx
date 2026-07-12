import { Badge } from "@/components/ui";
import { ROLE_PERSONAS, getRolePermissionsMatrix } from "@/lib/settings";

export function RolePermissions() {
  const matrix = getRolePermissionsMatrix();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Role personas
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Dispatcher, cleaner, inspector, manager, and admin map onto Hostpitality RBAC roles.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ROLE_PERSONAS.map((p) => (
            <li
              key={`${p.persona}-${p.role}`}
              className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{p.persona}</p>
                <Badge tone="info">{p.role}</Badge>
              </div>
              <p className="mt-1 text-[var(--muted)]">{p.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Permission matrix
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enforced in both UI routes and server actions. Role changes are audited.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 pr-3 font-semibold">Role</th>
                <th className="py-2 font-semibold">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.role} className="border-b border-[var(--border)]/70 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-[var(--muted)]">{row.persona}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {row.permissions.map((perm) => (
                        <Badge key={perm} tone="neutral">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
