import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import type { ReportOrder, CustomerReport } from "@/entities/customer";
import { calendarDate, money } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";

const columns: ColumnDef<ReportOrder>[] = [
  { accessorKey: "id", header: "Заказ" },
  { accessorKey: "date", header: "День", cell: ({ row }) => calendarDate(row.original.date) },
  { accessorKey: "amount", header: "До скидки", cell: ({ row }) => money(row.original.amount) },
  { accessorKey: "discount", header: "Скидка", cell: ({ row }) => money(row.original.discount) },
  { accessorKey: "amountPaid", header: "Оплачено", cell: ({ row }) => money(row.original.amountPaid) },
];
export interface ReportTableProps {
  report: CustomerReport; pagination: PaginationState; refreshing: boolean;
  onPaginationChange: (value: PaginationState) => void;
}
export function ReportOrders({ report, ...props }: ReportTableProps) {
  return <div className="mt-5"><DataTable data={report.orders} columns={columns} total={report.ordersPagination.total}
    {...props} label="Заказы в расчёте" empty="Оплаченных заказов за период нет." compact
    caption="Заказы, вошедшие в сумму. Итоги выше рассчитаны по всем страницам." /></div>;
}
