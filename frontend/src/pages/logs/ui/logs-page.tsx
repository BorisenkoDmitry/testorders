import { DiagnosticsReport } from "@/widgets/diagnostics-report";

export function LogsPage() {
  return <>
    <header className="mb-6"><h1 className="text-3xl font-semibold tracking-tight">Логи проверки</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Ошибки расчёта скидки и проверка дневных сумм клиентов. По умолчанию выбран период задания для c_7 — 27–31 марта.
      </p></header>
    <DiagnosticsReport />
  </>;
}
