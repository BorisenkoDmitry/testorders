import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/widgets/app-shell";
import { OrdersPage } from "@/pages/orders";
import { LogsPage } from "@/pages/logs";

export function AppRouter() {
  return <Routes><Route element={<AppShell />}>
    <Route index element={<Navigate to="/orders" replace />} />
    <Route path="orders" element={<OrdersPage />} />
    <Route path="logs" element={<LogsPage />} />
    <Route path="*" element={<Navigate to="/orders" replace />} />
  </Route></Routes>;
}
