"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUserAction, updateUserAction } from "@/lib/settings-actions";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";
import type { CompanyUserRow } from "@/lib/settings";
import { Badge, Button, Input, Label, ModuleCard, Select } from "@/components/ui";

export function UserManagement({
  users,
  properties,
}: {
  users: CompanyUserRow[];
  properties: Array<{ id: string; name: string; unitCode: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<{ error?: string }>, fd: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMessage("Saved");
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ModuleCard
        title="Add user"
        description="Create accounts for dispatcher, cleaner, inspector, manager, and admin personas."
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => run(createUserAction, fd)}
        >
          <div>
            <Label htmlFor="new-name" required>
              Name
            </Label>
            <Input id="new-name" name="name" required disabled={pending} />
          </div>
          <div>
            <Label htmlFor="new-email" required>
              Email
            </Label>
            <Input id="new-email" name="email" type="email" required disabled={pending} />
          </div>
          <div>
            <Label htmlFor="new-role">Role</Label>
            <Select id="new-role" name="role" defaultValue="PROPERTY_MANAGER" disabled={pending}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-password" required>
              Temp password
            </Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={8}
              disabled={pending}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] sm:col-span-2">
            <input type="checkbox" name="allProperties" value="1" defaultChecked disabled={pending} />
            Access all properties
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </ModuleCard>

      <ModuleCard title="Team members" description="Edit roles, active state, and property access scope.">
        <ul className="space-y-3">
          {users.map((u) => {
            const editing = editingId === u.id;
            return (
              <li
                key={u.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3"
              >
                {!editing ? (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{u.name}</p>
                      <p className="text-xs text-[var(--muted)]">{u.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone="info">{u.roleLabel}</Badge>
                        <Badge tone={u.active ? "success" : "warning"}>
                          {u.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge tone="neutral">
                          {u.accessScope.allProperties
                            ? "All properties"
                            : `${u.accessScope.propertyIds.length} properties`}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(u.id)}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <form
                    className="grid gap-3 sm:grid-cols-2"
                    action={(fd) => run(updateUserAction, fd)}
                  >
                    <input type="hidden" name="userId" value={u.id} />
                    <div>
                      <Label htmlFor={`name-${u.id}`} required>
                        Name
                      </Label>
                      <Input
                        id={`name-${u.id}`}
                        name="name"
                        defaultValue={u.name}
                        required
                        disabled={pending}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`role-${u.id}`}>Role</Label>
                      <Select
                        id={`role-${u.id}`}
                        name="role"
                        defaultValue={u.role as Role}
                        disabled={pending}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        name="active"
                        value="1"
                        defaultChecked={u.active}
                        disabled={pending}
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        name="allProperties"
                        value="1"
                        defaultChecked={u.accessScope.allProperties}
                        disabled={pending}
                      />
                      All properties
                    </label>
                    {!u.accessScope.allProperties ? (
                      <div className="sm:col-span-2">
                        <Label htmlFor={`propertyIds-${u.id}`}>
                          Property IDs (comma-separated)
                        </Label>
                        <Input
                          id={`propertyIds-${u.id}`}
                          name="propertyIds"
                          defaultValue={u.accessScope.propertyIds.join(",")}
                          placeholder={properties.map((p) => p.id).slice(0, 2).join(",")}
                          disabled={pending}
                        />
                      </div>
                    ) : (
                      <input type="hidden" name="propertyIds" value="" />
                    )}
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="submit" size="sm" disabled={pending}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </ModuleCard>

      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
