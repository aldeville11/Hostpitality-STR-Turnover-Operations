"use client";

import { useMemo, useState } from "react";
import type { DataTableColumn } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/** Client-side sort wrapper around DataTable for already-loaded rows. */
export function SortableDataTable<T extends { id: string }>({
  columns,
  rows,
  initialSortKey,
  initialSortDir = "asc",
  ...rest
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  onRowHref?: (row: T) => string;
  mobileCard?: (row: T) => React.ReactNode;
}) {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.id === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((ra, rb) => {
      const cmp = compareValues(col.sortValue!(ra), col.sortValue!(rb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  function onSort(columnId: string) {
    if (sortKey === columnId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(columnId);
      setSortDir("asc");
    }
  }

  return (
    <DataTable
      columns={columns}
      rows={sorted}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      {...rest}
    />
  );
}
