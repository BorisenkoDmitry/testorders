import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { syncOrders } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { RequestError } from "@/shared/ui/request-state";

export function SyncOrdersButton() {
  const queryClient = useQueryClient();
  const sync = useMutation({
    mutationFn: syncOrders,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["diagnostics"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-report"] }),
      ]);
    },
  });
  return <div className="grid gap-3">
    <Button onClick={() => sync.mutate()} disabled={sync.isPending} aria-busy={sync.isPending} className="justify-self-start sm:justify-self-end">
      <RefreshCw className={sync.isPending ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden />
      {sync.isPending ? "Обновляем заказы…" : "Обновить заказы"}
    </Button>
    <p role="status" className="max-w-xl text-sm text-muted-foreground">
      {sync.isPending && "Забираем все страницы внешнего API. Первая загрузка может занять несколько минут."}
      {!sync.isPending && sync.data && "Получено " + sync.data.received + ", применено " + sync.data.applied
        + ", без изменений " + sync.data.stale + ", некорректных " + sync.data.invalid + "."}
    </p>
    {sync.error && <RequestError error={sync.error} />}
  </div>;
}
