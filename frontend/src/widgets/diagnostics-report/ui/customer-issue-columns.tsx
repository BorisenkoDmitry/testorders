import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerIssue } from "@/entities/diagnostic";
import type { DailyTotal } from "@/entities/customer";
import { calendarDate, money } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";

function Amounts({ value }: { value: DailyTotal | null }) {
  if (!value) return <span>—</span>;
  return <div className="grid gap-1 text-xs tabular-nums">
    <span>До скидки {money(value.gross)}</span><span>Оплачено {money(value.net)}</span><span>Скидка {money(value.discount)}</span>
  </div>;
}
export const customerIssueColumns: ColumnDef<CustomerIssue>[] = [
  { id: "customer", header: "Клиент / день", cell: ({ row: { original: issue } }) => <>
    <span className="font-medium">{issue.customerId}</span><span className="block text-muted-foreground">{issue.date ? calendarDate(issue.date) : "—"}</span>
    <span className="text-xs text-muted-foreground">{issue.timezone}</span></> },
  { id: "check", header: "Проверка", cell: ({ row: { original: issue } }) => <div className="max-w-80 whitespace-normal">
    <Badge variant={issue.kind === "legacy_timezone" ? "secondary" : "destructive"}>{issue.kind === "legacy_timezone" ? "Прежний алгоритм" : "Ошибка"}</Badge>
    <p className="mt-2 text-xs text-muted-foreground">{issue.message}</p></div> },
  { accessorKey: "legacyTotal", header: "Прежний total", cell: ({ row }) => row.original.legacyTotal === null ? "—" : money(row.original.legacyTotal) },
  { id: "actual", header: "Текущий расчёт", cell: ({ row }) => <Amounts value={row.original.actual} /> },
  { id: "expected", header: "Контрольный расчёт", cell: ({ row }) => <Amounts value={row.original.expected} /> },
];
