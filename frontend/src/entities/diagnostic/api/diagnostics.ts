import { queryOptions } from "@tanstack/react-query";
import { request } from "@/shared/api/http";
import type { PageRequest } from "@/shared/api/pagination";
import type { Diagnostics } from "../model/types";

export const diagnosticsQuery = (from: string, to: string, discounts: PageRequest, customers: PageRequest) => queryOptions({
  queryKey: ["diagnostics", from, to, discounts, customers],
  queryFn: ({ signal }) => request<Diagnostics>("/diagnostics?" + new URLSearchParams({ from, to,
    discountLimit: String(discounts.pageSize), discountOffset: String(discounts.pageIndex * discounts.pageSize),
    customerLimit: String(customers.pageSize), customerOffset: String(customers.pageIndex * customers.pageSize),
  }), { signal }),
  placeholderData: (previous, query) => query?.queryKey[1] === from && query.queryKey[2] === to ? previous : undefined,
  staleTime: 60_000,
});
