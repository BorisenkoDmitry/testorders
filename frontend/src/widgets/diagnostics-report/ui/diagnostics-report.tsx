import { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { diagnosticsQuery } from "@/entities/diagnostic";
import { DiagnosticsToolbar, selectDiagnosticFilters } from "@/features/diagnostics-filter";
import { Skeleton } from "@/shared/ui/loading-indicator";
import { RequestError } from "@/shared/ui/request-state";
import { CustomerIssuesTable } from "./customer-issues-table";
import { DiscountIssuesTable } from "./discount-issues-table";
import { DiagnosticsSummary } from "./diagnostics-summary";

function Results({ from, to }: { from: string; to: string }) {
  const [discounts, setDiscounts] = useState({ pageIndex: 0, pageSize: 50 });
  const [customers, setCustomers] = useState({ pageIndex: 0, pageSize: 50 });
  const query = useQuery(diagnosticsQuery(from, to, discounts, customers));
  const report = query.data;
  const state = { loading: query.isPending, refreshing: query.isFetching && !query.isPending };
  return <>
    <DiagnosticsToolbar pending={query.isFetching} refresh={() => { void query.refetch(); }} />
    {query.error && <div className="mt-5"><RequestError error={query.error} retry={() => { void query.refetch(); }} /></div>}
    {query.isPending && <div className="mt-6 grid gap-4" aria-hidden><Skeleton className="h-20" /><Skeleton className="h-12" /></div>}
    {report && <DiagnosticsSummary report={report} />}
    {(!query.error || report) && <>
    <DiscountIssuesTable issues={report?.discountIssues ?? []} total={report?.discountPagination.total ?? 0}
      pagination={discounts} onPaginationChange={setDiscounts} {...state} />
    <CustomerIssuesTable issues={report?.customerIssues ?? []} total={report?.customerPagination.total ?? 0}
      pagination={customers} onPaginationChange={setCustomers} {...state} />
    </>}
  </>;
}
export function DiagnosticsReport() {
  const { applied } = useSelector(selectDiagnosticFilters);
  return <Results key={applied.from + applied.to} from={applied.from} to={applied.to} />;
}
