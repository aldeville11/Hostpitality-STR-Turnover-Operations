import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Input, Select } from "@/components/ui";

export type FilterField =
  | {
      type: "search";
      name: string;
      placeholder: string;
      defaultValue?: string;
    }
  | {
      type: "select";
      name: string;
      label?: string;
      defaultValue?: string;
      options: { value: string; label: string }[];
      emptyLabel: string;
    }
  | {
      type: "date";
      name: string;
      label?: string;
      defaultValue?: string;
    }
  | {
      type: "checkbox";
      name: string;
      label: string;
      value?: string;
      defaultChecked?: boolean;
    };

export function ListFilterBar({
  fields,
  resetHref,
  trailing,
}: {
  fields: FilterField[];
  resetHref: string;
  trailing?: ReactNode;
}) {
  return (
    <form className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
      {fields.map((field) => {
        if (field.type === "search") {
          return (
            <div key={field.name} className="min-w-[180px] flex-1">
              <Input
                name={field.name}
                defaultValue={field.defaultValue ?? ""}
                placeholder={field.placeholder}
                aria-label={field.placeholder}
              />
            </div>
          );
        }
        if (field.type === "select") {
          const selectId = `filter-${field.name}`;
          return (
            <div key={field.name} className="min-w-[140px]">
              {field.label ? (
                <label
                  htmlFor={selectId}
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
                >
                  {field.label}
                </label>
              ) : null}
              <Select
                id={selectId}
                name={field.name}
                defaultValue={field.defaultValue ?? ""}
                aria-label={field.label ?? field.emptyLabel}
              >
                <option value="">{field.emptyLabel}</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          );
        }
        if (field.type === "date") {
          const dateId = `filter-${field.name}`;
          return (
            <div key={field.name} className="min-w-[140px]">
              {field.label ? (
                <label
                  htmlFor={dateId}
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
                >
                  {field.label}
                </label>
              ) : null}
              <Input
                id={dateId}
                type="date"
                name={field.name}
                defaultValue={field.defaultValue ?? ""}
                aria-label={field.label ?? field.name}
              />
            </div>
          );
        }
        return (
          <label
            key={field.name}
            className="flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 text-sm text-[var(--text-secondary)]"
          >
            <input
              type="checkbox"
              name={field.name}
              value={field.value ?? "1"}
              defaultChecked={field.defaultChecked}
              className="rounded border-[var(--border)]"
            />
            {field.label}
          </label>
        );
      })}
      <Button type="submit" size="sm">
        Apply
      </Button>
      <Link
        href={resetHref}
        className="inline-flex min-h-8 items-center rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
      >
        Reset
      </Link>
      {trailing}
    </form>
  );
}
