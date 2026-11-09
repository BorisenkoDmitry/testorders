import type { ColumnDef } from "@tanstack/react-table";
import { OrderStatus, type Order } from "@/entities/order";
import { ReportButton } from "@/features/customer-report";
import { dateTime, money } from "@/shared/lib/format";

export const orderColumns: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "Заказ" }, { accessorKey: "customerId", header: "Клиент" },
  { accessorKey: "amount", header: "До скидки", cell: ({ row }) => <span className="block text-right tabular-nums">{money(row.original.amount)}</span> },
  { id: "discount", header: "Скидка", cell: ({ row: { original: order } }) => <div className="text-right tabular-nums">
    {money(order.discount)}<span className="block text-xs text-muted-foreground">{order.discountPercent === null ? "Процент не передан" : order.discountPercent + "%"}</span>
  </div> },
  { accessorKey: "amountPaid", header: "После скидки", cell: ({ row }) => <span className="block text-right font-medium tabular-nums">{money(row.original.amountPaid)}</span> },
  { accessorKey: "status", header: "Статус", cell: ({ row }) => <OrderStatus status={row.original.status} /> },
  { accessorKey: "createdAt", header: "Создан", cell: ({ row }) => <span className="text-muted-foreground">{dateTime(row.original.createdAt)}</span> },
  { accessorKey: "updatedAt", header: "Обновлён", cell: ({ row }) => <span className="text-muted-foreground">{dateTime(row.original.updatedAt)}</span> },
  { id: "report", header: "Сумма клиента", cell: ({ row }) => <ReportButton customerId={row.original.customerId} orderId={row.original.id} /> },
];
