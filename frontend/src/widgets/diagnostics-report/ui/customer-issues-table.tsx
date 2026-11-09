import type { CustomerIssue } from "@/entities/diagnostic";
import { DataTable } from "@/shared/ui/data-table";
import { customerIssueColumns } from "./customer-issue-columns";
import type { IssueTableProps } from "./discount-issues-table";

export function CustomerIssuesTable({ issues, ...props }: IssueTableProps<CustomerIssue>) {
  return <section className="mt-8" aria-labelledby="customer-issues-heading">
    <h2 id="customer-issues-heading" className="text-xl font-semibold">Проверка клиентов</h2>
    <p className="mt-2 mb-2 text-sm text-muted-foreground">
      Текущий расчёт сверяется с PostgreSQL по часовому поясу клиента. Отдельно показаны расхождения прежнего алгоритма.
    </p>
    <DataTable {...props} data={issues} columns={customerIssueColumns} label="Проверка клиентов"
      empty="Проблем и расхождений прежнего расчёта за период не найдено." />
  </section>;
}
