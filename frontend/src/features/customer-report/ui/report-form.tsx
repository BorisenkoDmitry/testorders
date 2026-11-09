import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LoadingIndicator, Skeleton } from "@/shared/ui/loading-indicator";
import { RequestError } from "@/shared/ui/request-state";
import { reportPeriodChanged, selectReport } from "../model/report-slice";
import { useCustomerReport } from "../model/use-customer-report";
import { ReportResult } from "./report-result";

export function ReportForm({ customerId, active }: { customerId: string; active: boolean }) {
  const { from, to } = useSelector(selectReport);
  const dispatch = useDispatch();
  const { query, pagination, setPagination, period, reset, calculate } = useCustomerReport(customerId, active);
  function changePeriod(next: { from: string; to: string }) { dispatch(reportPeriodChanged(next)); reset(); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (from <= to && !query.isFetching) calculate(from, to);
  }
  return <>
    <form className="grid items-end gap-4 sm:grid-cols-3" onSubmit={submit}>
      <div className="grid gap-2"><Label htmlFor="date-from">Дата от</Label>
        <Input id="date-from" type="date" required value={from} disabled={query.isFetching}
          min="0001-01-01" max="9999-12-31" onChange={(event) => changePeriod({ from: event.target.value, to })} /></div>
      <div className="grid gap-2"><Label htmlFor="date-to">Дата до</Label>
        <Input id="date-to" type="date" required value={to} disabled={query.isFetching}
          min={from || "0001-01-01"} max="9999-12-31" onChange={(event) => changePeriod({ from, to: event.target.value })} /></div>
      <Button type="submit" disabled={query.isFetching} aria-busy={query.isFetching}>
        {query.isFetching ? <LoadingIndicator className="text-primary-foreground">Считаем…</LoadingIndicator> : "Посчитать"}
      </Button>
    </form>
    {period && query.isPending && <div className="mt-5 grid gap-4" aria-busy="true">
      <LoadingIndicator>Получаем сумму и список заказов…</LoadingIndicator>
      <Skeleton className="h-16" /><Skeleton className="h-36" />
    </div>}
    {period && query.error && <div className="mt-4"><RequestError error={query.error} retry={() => { void query.refetch(); }} /></div>}
    {period && query.data && <ReportResult report={query.data} pagination={pagination}
      onPaginationChange={setPagination} refreshing={query.isFetching} />}
  </>;
}
