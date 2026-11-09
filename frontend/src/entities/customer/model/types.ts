import type { Order } from "@/entities/order/@x/customer";
import type { PageInfo } from "@/shared/api/pagination";
export interface DailyTotal { date: string; total: number; gross: number; net: number; discount: number }
export interface ReportOrder extends Order { date: string; amountPaid: number; discountPercent: number | null }
export interface CustomerReport {
  customerId: string; timezone: string; from: string; to: string;
  total: number; gross: number; net: number; discount: number;
  daily: DailyTotal[]; orders: ReportOrder[]; ordersPagination: PageInfo;
}
