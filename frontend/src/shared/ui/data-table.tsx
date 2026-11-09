import { useEffect } from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "./data-table-pagination";
import { LoadingIndicator, Skeleton } from "./loading-indicator";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";

interface Props<T> {
  data: T[]; columns: ColumnDef<T>[]; total: number; pagination: PaginationState;
  onPaginationChange: (value: PaginationState) => void; label: string; empty: string;
  loading?: boolean; refreshing?: boolean; caption?: string; compact?: boolean;
}
export function DataTable<T>({ data, columns, total, pagination, onPaginationChange, label, empty,
  loading = false, refreshing = false, caption, compact = false }: Props<T>) {
  const busy = loading || refreshing;
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true,
    rowCount: total, state: { pagination }, onPaginationChange: (next) =>
      onPaginationChange(typeof next === "function" ? next(pagination) : next),
  });
  useEffect(() => {
    if (busy) return;
    const last = Math.max(0, Math.ceil(total / pagination.pageSize) - 1);
    if (pagination.pageIndex > last) onPaginationChange({ ...pagination, pageIndex: last });
  }, [total, pagination, onPaginationChange, busy]);
  return <section aria-label={label} aria-busy={busy}>
    <div className="flex min-h-8 items-center pb-2" aria-live="polite">
      {busy && <LoadingIndicator>{loading ? "Загружаем таблицу…" : "Обновляем таблицу…"}</LoadingIndicator>}
    </div>
    <div className={"overflow-hidden rounded-xl border bg-card " + (compact ? "max-h-80 overflow-y-auto" : "")}
      tabIndex={0} role="region" aria-label={label + ": прокрутка"}>
      <Table>
        {caption && <TableCaption className="m-0 p-3 text-left whitespace-normal">{caption}</TableCaption>}
        <TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>
          {group.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
        </TableRow>)}</TableHeader>
        <TableBody className={refreshing ? "opacity-60 transition-opacity duration-150" : "transition-opacity duration-150"}>
          {loading ? Array.from({ length: 5 }, (_, row) => <TableRow key={row}>
            {columns.map((_, cell) => <TableCell key={cell} className="h-14"><Skeleton className="h-4 min-w-16" /></TableCell>)}
          </TableRow>) : table.getRowModel().rows.map((row) => <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
          </TableRow>)}
          {!loading && !data.length && <TableRow><TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground whitespace-normal">{empty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
    <DataTablePagination table={table} total={total} busy={busy} />
  </section>;
}
