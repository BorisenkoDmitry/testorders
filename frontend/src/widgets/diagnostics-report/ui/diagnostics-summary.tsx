import type { Diagnostics } from "@/entities/diagnostic";
import { dateTime } from "@/shared/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export function DiagnosticsSummary({ report }: { report: Diagnostics }) {
  return <div className="mt-6 grid gap-4">
    <dl className="flex flex-wrap gap-x-8 gap-y-4 border-y py-5">
      {[["Проверено заказов", report.ordersChecked], ["Проверено клиентов", report.customersChecked],
        ["Ошибок скидки", report.discountPagination.total], ["Ошибок клиентов", report.customerErrors]].map(([title, count]) =>
        <div key={title}><dt className="text-sm text-muted-foreground">{title}</dt><dd className="mt-1 text-xl font-semibold">{count}</dd></div>)}
    </dl>
    <p className="text-sm text-muted-foreground">
      Полная проверка скидки для {report.discountChecked} заказов. Старый формат без полей скидки — {report.legacyOrders}.
      Неполные данные — {report.incompletePricing}. Сравнение прежнего алгоритма — {report.legacyDateDifferences} расхождений.
      Проверено {dateTime(report.checkedAt)}.
    </p>
    {report.pricingRefreshNeeded > 0 && <Alert>
      <AlertTitle>Нужна повторная синхронизация</AlertTitle>
      <AlertDescription>У {report.pricingRefreshNeeded} ранее загруженных заказов ещё нет обновлённых данных о скидке.</AlertDescription>
    </Alert>}
    <p className="text-xs leading-relaxed text-muted-foreground">
      Это результат последней проверки сохранённых данных. Заказы старого формата учтены без скидки.
      Оплата из API сохраняется при расхождении с формулой. Отчёт платёжной системы для сверки списаний не предоставлен.
    </p>
  </div>;
}
