import { Badge } from "@/shared/ui/badge";
import type { Order } from "../model/types";

const labels = { paid: "Оплачен", pending: "Ожидает оплаты", refunded: "Возвращён" };
const colors = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  refunded: "border-violet-200 bg-violet-50 text-violet-800",
};
export function OrderStatus({ status }: { status: Order["status"] }) {
  return <Badge variant="outline" className={colors[status]}>{labels[status]}</Badge>;
}
