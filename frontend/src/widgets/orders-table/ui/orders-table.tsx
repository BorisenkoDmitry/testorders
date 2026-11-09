import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { ordersQuery } from "@/entities/order";
import { pageChanged, selectOrdersPage } from "@/features/order-pagination";
import { DataTable } from "@/shared/ui/data-table";
import { RequestError } from "@/shared/ui/request-state";
import { orderColumns } from "./order-columns";

export function OrdersTable() {
  const pagination = useSelector(selectOrdersPage);
  const dispatch = useDispatch();
  const query = useQuery(ordersQuery(pagination));
  return <>
    {query.error && <RequestError error={query.error} retry={() => { void query.refetch(); }} />}
    {(!query.error || query.data) && <DataTable data={query.data?.items ?? []} columns={orderColumns} total={query.data?.total ?? 0}
      pagination={pagination} onPaginationChange={(page) => dispatch(pageChanged(page))}
      label="Таблица заказов" empty="Заказов пока нет. Нажмите «Обновить заказы», чтобы загрузить их."
      loading={query.isPending} refreshing={query.isFetching && !query.isPending}
      caption="Суммы в рублях. После скидки — оплата из API или расчёт при отсутствии оплаты. Время по часовому поясу браузера." />}
  </>;
}
