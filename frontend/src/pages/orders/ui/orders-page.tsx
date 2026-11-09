import { OrdersTable } from "@/widgets/orders-table";
import { CustomerReportDialog } from "@/features/customer-report";
import { SyncOrdersButton } from "@/features/order-sync";

export function OrdersPage() {
  return <>
    <header className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
      <div><h1 className="text-3xl font-semibold tracking-tight">Заказы</h1>
        <p className="mt-2 text-sm text-muted-foreground">Сохранённые заказы из внешней системы. Расчёт суммы доступен для каждого клиента.</p></div>
      <SyncOrdersButton />
    </header>
    <OrdersTable />
    <CustomerReportDialog />
  </>;
}
