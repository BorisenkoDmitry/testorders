import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { request } from "@/shared/api/http";
import type { PageRequest } from "@/shared/api/pagination";
import type { OrdersPage, SyncStats } from "../model/types";

export const ordersQuery = (page: PageRequest) => queryOptions({
  queryKey: ["orders", page],
  queryFn: ({ signal }) => request<OrdersPage>("/orders?" + new URLSearchParams({
    limit: String(page.pageSize), offset: String(page.pageIndex * page.pageSize),
  }), { signal }),
  placeholderData: keepPreviousData,
});
export const syncOrders = () => request<SyncStats>("/sync", { method: "POST" });
