import { useDispatch } from "react-redux";
import { Button } from "@/shared/ui/button";
import { reportOpened } from "../model/report-slice";

export function ReportButton({ customerId, orderId }: { customerId: string; orderId: string }) {
  const dispatch = useDispatch();
  return <Button id={"report-trigger-" + orderId} variant="outline"
    aria-label={"Посчитать сумму для клиента " + customerId}
    onClick={() => dispatch(reportOpened({ customerId, orderId }))}>Посчитать сумму</Button>;
}
