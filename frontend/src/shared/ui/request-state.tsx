import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

export function RequestError({ error, retry }: { error: Error; retry?: () => void }) {
  return <Alert variant="destructive" role="alert">
    <AlertTitle>Не удалось получить данные</AlertTitle>
    <AlertDescription className="grid gap-3">
      <span>{error.message}</span>
      {retry && <Button variant="outline" className="w-fit" onClick={retry}>Повторить</Button>}
    </AlertDescription>
  </Alert>;
}
export function LoadingMessage({ children = "Загружаем данные…" }: { children?: string }) {
  return <p role="status" className="py-5 text-sm text-muted-foreground">{children}</p>;
}
