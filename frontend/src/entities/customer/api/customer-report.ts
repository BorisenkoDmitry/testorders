import { queryOptions } from "@tanstack/react-query";
import { request } from "@/shared/api/http";
import type { PageRequest } from "@/shared/api/pagination";
import type { CustomerReport } from "../model/types";

export const customerReportQuery = (customerId: string, from: string, to: string, page: PageRequest) => queryOptions({
  queryKey: ["customer-report", customerId, from, to, page],
  queryFn: ({ signal }) => request<CustomerReport>("/customers/" + encodeURIComponent(customerId) + "/daily-totals?" +
    new URLSearchParams({ from, to, includeOrders: "true", ordersLimit: String(page.pageSize),
      ordersOffset: String(page.pageIndex * page.pageSize) }), { signal }),
  placeholderData: (previous, query) => query?.queryKey[1] === customerId &&
    query.queryKey[2] === from && query.queryKey[3] === to ? previous : undefined,
});
