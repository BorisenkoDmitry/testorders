import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { reportClosed, selectReport } from "../model/report-slice";
import { ReportForm } from "./report-form";

export function CustomerReportDialog() {
  const { customerId, orderId } = useSelector(selectReport);
  const dispatch = useDispatch();
  useEffect(() => () => { dispatch(reportClosed()); }, [dispatch]);
  const last = useRef({ customerId, orderId });
  if (customerId) last.current = { customerId, orderId };
  const selected = last.current;
  return <Dialog open={Boolean(customerId)} onOpenChange={(open) => { if (!open) dispatch(reportClosed()); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        document.getElementById("report-trigger-" + selected.orderId)?.focus();
      }}>
      <DialogHeader>
        <DialogTitle>Сумма заказов клиента {selected.customerId}</DialogTitle>
        <DialogDescription>Только оплаченные заказы. Обе даты входят в период, дни определяются в часовом поясе клиента.</DialogDescription>
      </DialogHeader>
      {selected.customerId && <ReportForm key={selected.customerId} customerId={selected.customerId} active={Boolean(customerId)} />}
    </DialogContent>
  </Dialog>;
}
