import type { DailyTotal } from "@/entities/customer/@x/diagnostic";
import type { PageInfo } from "@/shared/api/pagination";
export interface DiscountIssue {
  orderId: string; customerId: string; status: string; amount: number;
  discountPercent: number; expectedPaid: number; actualPaid: number; difference: number; message: string;
}
export interface CustomerIssue {
  customerId: string; timezone: string | null; date: string | null;
  kind: "calculation" | "legacy_timezone" | "customer";
  message: string; actual: DailyTotal | null; expected: DailyTotal | null; legacyTotal: number | null;
}
export interface Diagnostics {
  checkedAt: string; from: string; to: string; ordersChecked: number; pricingRefreshNeeded: number;
  discountChecked: number; legacyOrders: number; incompletePricing: number;
  discountIssues: DiscountIssue[]; discountPagination: PageInfo; customerPagination: PageInfo; customersChecked: number; customerErrors: number;
  legacyDateDifferences: number; customerIssues: CustomerIssue[]; paymentReportAvailable: boolean;
}
