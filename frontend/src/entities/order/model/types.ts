export interface Order {
  id: string; customerId: string; amount: number;
  amountPaid: number; discount: number; discountPercent: number | null;
  status: "pending" | "paid" | "refunded"; createdAt: string; updatedAt: string;
}
export interface OrdersPage { items: Order[]; total: number; hasMore: boolean; limit: number; offset: number }
export interface SyncStats { pages: number; received: number; applied: number; stale: number; invalid: number }
