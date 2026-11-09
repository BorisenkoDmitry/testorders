import { z } from "zod";
import { ValidationError } from "../errors.js";
import type { Order, OrdersRepository } from "../repositories/orders.js";
import { fromKop, netKop, parseRub, toKop } from "../utils/money.js";
import { parseUtc } from "../utils/time.js";

const Money = z.union([z.number(), z.string().max(128)]);
const ExternalOrder = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  amount: Money,
  discountPercent: Money.optional(),
  amountPaid: Money.optional(),
  status: z.enum(["pending", "paid", "refunded"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApplyResult = "created" | "updated" | "stale";

export class OrdersService {
  constructor(private readonly orders: OrdersRepository) {}

  async list(limit: number, offset: number) {
    const { orders, total } = await this.orders.list(limit, offset);
    return {
      items: orders.map((order) => ({
        id: order.id,
        customerId: order.customerId,
        amount: fromKop(order.amountKop),
        amountPaid: fromKop(netKop(order)),
        discount: fromKop(order.amountKop - netKop(order)),
        discountPercent: order.discountPercent,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      total,
      hasMore: offset + orders.length < total,
    };
  }

  normalize(raw: unknown): Order {
    const parsed = ExternalOrder.safeParse(raw);
    if (!parsed.success) throw new ValidationError(`invalid order: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
    const order = parsed.data;
    try {
      const discountPercent = order.discountPercent === undefined ? null : parseRub(order.discountPercent);
      if (discountPercent !== null && discountPercent > 100) throw new Error("discountPercent must be 0..100");
      return {
        id: order.id,
        customerId: order.customerId,
        amountKop: toKop(order.amount),
        amountPaidKop: order.amountPaid === undefined ? null : toKop(order.amountPaid),
        discountPercent,
        pricingVersion: 1,
        status: order.status,
        createdAt: parseUtc(order.createdAt),
        updatedAt: parseUtc(order.updatedAt),
      };
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  }

  async apply(raw: unknown): Promise<ApplyResult> {
    return this.orders.save(this.normalize(raw));
  }
}
