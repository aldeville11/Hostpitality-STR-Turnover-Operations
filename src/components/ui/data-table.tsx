import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  sortable?: boolean;
  cell: (row: T) => ReactNode;
  /** Optional value used for client-side sort */
  sortValue?: (row: T) => string | number | Date | null | undefined;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowHref,
  sortKey,
  sortDir,
  onSort,
  mobileCard,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  onRowHref?: (row: T) => string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (columnId: string) => void;
  /** When provided, shown below `md` instead of the table */
  mobileCard?: (row: T) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="space-y-3">
      {mobileCard ? (
        <ul className="space-y-2 md:hidden">
          {rows.map((row) => (
            <li key={row.id}>{mobileCard(row)}</li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
          mobileCard && "hidden md:block"
        )}
      >
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface-raised)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => {
                const active = sortKey === col.id;
                return (
                  <th key={col.id} className={cn("whitespace-nowrap px-3 py-2.5", col.className)}>
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                        onClick={() => onSort(col.id)}
                      >
                        {col.header}
                        <span className="text-[10px] opacity-70" aria-hidden>
                          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = onRowHref?.(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)]/70 transition-colors duration-[var(--transition)] hover:bg-[var(--surface-raised)]"
                >
                  {columns.map((col, i) => (
                    <td key={col.id} className={cn("px-3 py-2.5 align-middle", col.className)}>
                      {href && i === 0 ? (
                        <a href={href} className="font-medium text-[var(--accent-strong)] hover:underline">
                          {col.cell(row)}
                        </a>
                      ) : (
                        col.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
