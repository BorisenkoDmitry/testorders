import type { ReportTableProps } from "./report-orders";
import { calendarDate, money } from "@/shared/lib/format";
import { ReportOrders } from "./report-orders";

export function ReportResult({ report, ...props }: ReportTableProps) {
  return <section className="mt-5 border-t pt-5" aria-label="Результат расчёта">
    <p className="text-sm text-muted-foreground">С {calendarDate(report.from)} по {calendarDate(report.to)} включительно</p>
    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[["До скидки", report.gross], ["Скидка", report.discount], ["Оплачено", report.net]].map(([title, value]) =>
        <div key={title}><dt className="text-sm text-muted-foreground">{title}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">{money(Number(value))}</dd></div>)}
    </dl>
    <p className="mt-4 text-sm text-muted-foreground">Часовой пояс клиента {report.timezone}. Учтено заказов {report.ordersPagination.total}.</p>
    <ReportOrders report={report} {...props} />
  </section>;
}
