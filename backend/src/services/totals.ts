import type { Order, OrdersRepository } from "../repositories/orders.js";
import { fromKop, netKop } from "../utils/money.js";
import { dateAtOffset, datesBetween, tzOffsetMinutes } from "../utils/time.js";
import { paginate } from "../utils/pagination.js";
import type { CustomersService } from "./customers.js";

export interface DailyTotal {
  date: string;
  total: number;
  gross: number;
  discount: number;
  net: number;
}

const DAY = 86_400_000;

export class TotalsService {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly customers: CustomersService,
  ) {}

  async daily(customerId: string, from: string, to: string): Promise<DailyTotal[]> {
    return (await this.report(customerId, from, to)).daily;
  }

  async report(customerId: string, from: string, to: string, limit?: number, offset = 0) {
    const timezone = await this.customers.timezone(customerId);
    const rows = await this.orders.paidCreatedBetween(
      customerId,
      new Date(Date.parse(`${from}T00:00:00Z`) - DAY),
      new Date(Date.parse(`${to}T00:00:00Z`) + 2 * DAY),
    );
    const report = this.summarize(customerId, timezone, from, to, rows);
    const page = paginate(report.orders, limit, offset);
    return { ...report, orders: page.items, ordersPagination: page.pagination };
  }

  /** Чистый расчёт по одному снимку заказов, используемый также диагностикой. */
  summarize(customerId: string, timezone: string, from: string, to: string, rows: Order[]) {
    const sums = new Map(datesBetween(from, to).map((date) => [date, { gross: 0, net: 0 }]));
    const countedOrders: (Order & { date: string })[] = [];
    for (const order of rows) {
      const offset = tzOffsetMinutes(timezone, order.createdAt);
      const date = dateAtOffset(order.createdAt, offset);
      const current = sums.get(date);
      if (current !== undefined) {
        current.gross += order.amountKop;
        current.net += netKop(order);
        countedOrders.push({ ...order, date });
      }
    }
    const gross = [...sums.values()].reduce((total, day) => total + day.gross, 0);
    const net = [...sums.values()].reduce((total, day) => total + day.net, 0);
    countedOrders.sort((left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id),
    );
    return {
      customerId, timezone, from, to,
      total: fromKop(gross),
      gross: fromKop(gross),
      discount: fromKop(gross - net),
      net: fromKop(net),
      daily: [...sums].map(([date, day]) => ({
        date,
        total: fromKop(day.gross),
        gross: fromKop(day.gross),
        discount: fromKop(day.gross - day.net),
        net: fromKop(day.net),
      })),
      orders: countedOrders.map((order) => ({
        id: order.id,
        customerId: order.customerId,
        amount: fromKop(order.amountKop),
        amountPaid: fromKop(netKop(order)),
        discount: fromKop(order.amountKop - netKop(order)),
        discountPercent: order.discountPercent,
        status: order.status,
        date: order.date,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    };
  }
}
