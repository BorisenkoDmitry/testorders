import type { Table } from "@tanstack/react-table";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export function DataTablePagination<T>({ table, total, busy }: { table: Table<T>; total: number; busy: boolean }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const count = Math.max(1, table.getPageCount());
  const from = total ? Math.min(pageIndex * pageSize + 1, total) : 0;
  return <nav className="flex flex-wrap items-center justify-between gap-3 py-4" aria-label="Пагинация таблицы">
    <p className="text-sm text-muted-foreground tabular-nums">{from}–{Math.min((pageIndex + 1) * pageSize, total)} из {total}</p>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">На странице
        <select className="h-9 rounded-md border bg-card px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          value={pageSize} disabled={busy} onChange={(event) => table.setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}>
          {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <span className="text-sm tabular-nums">Страница {pageIndex + 1} из {count}</span>
      <div className="flex gap-1">
        <Button size="icon" variant="outline" aria-label="Первая страница" disabled={busy || !table.getCanPreviousPage()} onClick={() => table.firstPage()}><ChevronFirst aria-hidden /></Button>
        <Button size="icon" variant="outline" aria-label="Предыдущая страница" disabled={busy || !table.getCanPreviousPage()} onClick={() => table.previousPage()}><ChevronLeft aria-hidden /></Button>
        <Button size="icon" variant="outline" aria-label="Следующая страница" disabled={busy || !table.getCanNextPage()} onClick={() => table.nextPage()}><ChevronRight aria-hidden /></Button>
        <Button size="icon" variant="outline" aria-label="Последняя страница" disabled={busy || !table.getCanNextPage()} onClick={() => table.lastPage()}><ChevronLast aria-hidden /></Button>
      </div>
    </div>
  </nav>;
}
