import { useDispatch, useSelector } from "react-redux";
import { LoadingIndicator } from "@/shared/ui/loading-indicator";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { periodApplied, periodEdited, selectDiagnosticFilters } from "../model/filters-slice";

export function DiagnosticsToolbar({ pending, refresh }: { pending: boolean; refresh: () => void }) {
  const { draft, applied } = useSelector(selectDiagnosticFilters);
  const dispatch = useDispatch();
  return <form className="flex flex-wrap items-end gap-4" onSubmit={(event) => {
    event.preventDefault();
    if (draft.from > draft.to) return;
    if (draft.from === applied.from && draft.to === applied.to) refresh();
    else dispatch(periodApplied());
  }}>
    <div className="grid gap-2"><Label htmlFor="logs-from">Дата от</Label>
      <Input id="logs-from" type="date" required value={draft.from} disabled={pending}
        min="0001-01-01" max="9999-12-31"
        onChange={(event) => dispatch(periodEdited({ ...draft, from: event.target.value }))} /></div>
    <div className="grid gap-2"><Label htmlFor="logs-to">Дата до</Label>
      <Input id="logs-to" type="date" required value={draft.to} disabled={pending}
        min={draft.from || "0001-01-01"} max="9999-12-31"
        onChange={(event) => dispatch(periodEdited({ ...draft, to: event.target.value }))} /></div>
    <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? <LoadingIndicator className="text-primary-foreground">Проверяем…</LoadingIndicator> : "Проверить данные"}</Button>
  </form>;
}
