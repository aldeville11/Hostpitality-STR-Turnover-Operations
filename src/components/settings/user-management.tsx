"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUserAction, updateUserAction } from "@/lib/settings-actions";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";
import type { CompanyUserRow } from "@/lib/settings";
import { Badge, Button, Input, Select } from "@/components/ui";

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
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Add user
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Create accounts for dispatcher, cleaner, inspector, manager, and admin personas.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={(fd) => run(createUserAction, fd)}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <Input name="name" required disabled={pending} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input name="email" type="email" required disabled={pending} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <Select name="role" defaultValue="PROPERTY_MANAGER" disabled={pending}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Temp password</label>
            <Input name="password" type="password" required minLength={8} disabled={pending} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="allProperties" value="1" defaultChecked disabled={pending} />
            Access all properties
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Team members
        </h2>
        <ul className="mt-4 space-y-3">
          {users.map((u) => {
            const editing = editingId === u.id;
            return (
              <li key={u.id} className="rounded-xl border border-[var(--border)] px-3 py-3">
                {!editing ? (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{u.name}</p>
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
                      <label className="mb-1.5 block text-sm font-medium">Name</label>
                      <Input name="name" defaultValue={u.name} required disabled={pending} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Role</label>
                      <Select
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
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="active"
                        value="1"
                        defaultChecked={u.active}
                        disabled={pending}
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm">
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
                        <label className="mb-1.5 block text-sm font-medium">
                          Property IDs (comma-separated)
                        </label>
                        <Input
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
      </section>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
