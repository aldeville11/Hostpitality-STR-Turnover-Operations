import { Badge, ModuleCard } from "@/components/ui";
import { ROLE_PERSONAS, getRolePermissionsMatrix } from "@/lib/settings";

export function RolePermissions() {
  const matrix = getRolePermissionsMatrix();

  return (
    <div className="space-y-6">
      <ModuleCard
        title="Role personas"
        description="Dispatcher, cleaner, inspector, manager, and admin map onto Hostpitality RBAC roles."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {ROLE_PERSONAS.map((p) => (
            <li
              key={`${p.persona}-${p.role}`}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[var(--text-primary)]">{p.persona}</p>
                <Badge tone="info">{p.role}</Badge>
              </div>
              <p className="mt-1 text-[var(--text-secondary)]">{p.description}</p>
            </li>
          ))}
        </ul>
      </ModuleCard>

      <ModuleCard
        title="Permission matrix"
        description="Enforced in both UI routes and server actions. Role changes are audited."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 pr-3 font-semibold">Role</th>
                <th className="py-2 font-semibold">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.role} className="border-b border-[var(--border)]/70 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-[var(--text-primary)]">{row.label}</p>
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
      </ModuleCard>
    </div>
  );
}
