import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import type { DiscountIssue } from "@/entities/diagnostic";
import { money } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";

const columns: ColumnDef<DiscountIssue>[] = [
  { id: "order", header: "Заказ / клиент", cell: ({ row }) => <><span className="font-medium">{row.original.orderId}</span><span className="block text-muted-foreground">{row.original.customerId}</span></> },
  { accessorKey: "amount", header: "До скидки", cell: ({ row }) => money(row.original.amount) },
  { accessorKey: "discountPercent", header: "Скидка", cell: ({ row }) => row.original.discountPercent + "%" },
  { accessorKey: "expectedPaid", header: "По расчёту", cell: ({ row }) => money(row.original.expectedPaid) },
  { accessorKey: "actualPaid", header: "Оплачено по API", cell: ({ row }) => money(row.original.actualPaid) },
  { accessorKey: "difference", header: "Разница", cell: ({ row }) => <span className="font-medium text-destructive">{money(row.original.difference)}</span> },
];
export interface IssueTableProps<T> {
  issues: T[]; total: number; pagination: PaginationState;
  onPaginationChange: (value: PaginationState) => void; loading: boolean; refreshing: boolean;
}
export function DiscountIssuesTable({ issues, ...props }: IssueTableProps<DiscountIssue>) {
  return <section className="mt-8" aria-labelledby="discount-issues-heading">
    <h2 id="discount-issues-heading" className="text-xl font-semibold">Проблемы скидок</h2>
    <p className="mt-2 mb-2 text-sm text-muted-foreground">
      Только расхождения между переданной оплатой и расчётом по проценту. Проверяются заказы всех дат и статусов.
    </p>
    <DataTable {...props} data={issues} columns={columns} label="Проблемы скидок" empty="Расхождений расчёта скидок не найдено." />
  </section>;
}
