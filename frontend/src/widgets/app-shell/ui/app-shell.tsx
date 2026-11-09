import { NavLink, Outlet } from "react-router";
import { ListOrdered, ScrollText } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function AppShell() {
  return <div className="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
    <aside className="border-b bg-card p-5 lg:border-r lg:border-b-0">
      <div className="text-lg font-semibold tracking-tight">Orders Aggregator</div>
      <p className="mt-1 text-xs text-muted-foreground">Заказы и проверка данных</p>
      <nav className="mt-6 flex gap-2 lg:grid" aria-label="Основная навигация">
        {[{ to: "/orders", title: "Заказы", Icon: ListOrdered }, { to: "/logs", title: "Логи", Icon: ScrollText }].map(({ to, title, Icon }) =>
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}><Icon size={18} aria-hidden />{title}</NavLink>)}
      </nav>
    </aside>
    <main className="min-w-0 p-4 sm:p-7 lg:p-9"><div className="mx-auto max-w-[1500px]"><Outlet /></div></main>
  </div>;
}
