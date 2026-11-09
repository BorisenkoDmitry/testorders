import type { Db } from "../db.js";
import type { Order, OrdersRepository } from "../repositories/orders.js";
import { expectedPaidKop, fromKop } from "../utils/money.js";
import { dateAtOffset, datesBetween, tzOffsetMinutes } from "../utils/time.js";
import type { CustomersService } from "./customers.js";
import type { DailyTotal, TotalsService } from "./totals.js";

interface CustomerIssue {
  customerId: string;
  timezone: string | null;
  date: string | null;
  kind: "calculation" | "legacy_timezone" | "customer";
  message: string;
  actual: DailyTotal | null;
  expected: DailyTotal | null;
  legacyTotal: number | null;
}

interface ReferenceRow {
  date: string;
  gross_kop: string;
  net_kop: string;
}

export class DiagnosticsService {
  constructor(
    private readonly db: Db,
    private readonly orders: OrdersRepository,
    private readonly customers: CustomersService,
    private readonly totals: TotalsService,
  ) {}

  /** PostgreSQL независимо проверяет Intl-расчёт по тому же неизменяемому снимку. */
  private async reference(orders: Order[], timezone: string, from: string, to: string): Promise<DailyTotal[]> {
    const input = orders.map((order) => ({
      created_at: order.createdAt.toISOString(),
      amount_kop: order.amountKop,
      amount_paid_kop: order.amountPaidKop,
      discount_percent: order.discountPercent,
    }));
    const { rows } = await this.db.query<ReferenceRow>(
      `WITH amounts AS (
         SELECT (created_at AT TIME ZONE $2)::date AS day,
                amount_kop AS gross,
                COALESCE(amount_paid_kop,
                  CASE WHEN discount_percent IS NOT NULL
                    THEN ROUND(amount_kop::numeric * (100 - discount_percent) / 100)::bigint
                    ELSE amount_kop END) AS net
         FROM jsonb_to_recordset($1::jsonb)
           AS source(created_at timestamptz, amount_kop bigint,
                     amount_paid_kop bigint, discount_percent numeric)
       )
       SELECT day::text AS date, SUM(gross)::text AS gross_kop, SUM(net)::text AS net_kop
       FROM amounts WHERE day BETWEEN $3::date AND $4::date
       GROUP BY day ORDER BY day`,
      [JSON.stringify(input), timezone, from, to],
    );
    const byDate = new Map(rows.map((row) => [row.date, row]));
    return datesBetween(from, to).map((date) => {
      const row = byDate.get(date);
      const gross = Number(row?.gross_kop ?? 0);
      const net = Number(row?.net_kop ?? 0);
      return { date, total: fromKop(gross), gross: fromKop(gross), net: fromKop(net), discount: fromKop(gross - net) };
    });
  }

  async run(from: string, to: string) {
    const snapshot = await this.orders.all();
    const discountIssues = [];
    let discountChecked = 0;
    let legacyOrders = 0;
    let incompletePricing = 0;
    for (const order of snapshot) {
      if (order.amountPaidKop === null && order.discountPercent === null) {
        legacyOrders++;
        continue;
      }
      if (order.amountPaidKop === null || order.discountPercent === null) {
        incompletePricing++;
        continue;
      }
      discountChecked++;
      const expected = expectedPaidKop(order.amountKop, order.discountPercent);
      if (expected !== order.amountPaidKop) {
        discountIssues.push({
          orderId: order.id,
          customerId: order.customerId,
          status: order.status,
          amount: fromKop(order.amountKop),
          discountPercent: order.discountPercent,
          expectedPaid: fromKop(expected),
          actualPaid: fromKop(order.amountPaidKop),
          difference: fromKop(order.amountPaidKop - expected),
          message: "Переданная оплата расходится с расчётом по проценту скидки",
        });
      }
    }

    const customerIssues: CustomerIssue[] = [];
    const customerIds = [...new Set([...snapshot.map((order) => order.customerId), "c_7"])].sort();
    let customersChecked = 0;
    const now = new Date();
    for (const customerId of customerIds) {
      try {
        const timezone = await this.customers.timezone(customerId);
        const paid = snapshot.filter((order) => order.customerId === customerId && order.status === "paid");
        const actual = this.totals.summarize(customerId, timezone, from, to, paid).daily;
        const expected = await this.reference(paid, timezone, from, to);
        const currentOffset = tzOffsetMinutes(timezone, now);
        const legacy = new Map(datesBetween(from, to).map((date) => [date, 0]));
        for (const order of paid) {
          const date = dateAtOffset(order.createdAt, currentOffset);
          const amount = legacy.get(date);
          if (amount !== undefined) legacy.set(date, amount + order.amountKop);
        }
        for (let index = 0; index < expected.length; index++) {
          const day = actual[index];
          const reference = expected[index];
          const mismatch = (["total", "gross", "net", "discount"] as const)
            .some((field) => day[field] !== reference[field]);
          if (mismatch) {
            customerIssues.push({
              customerId, timezone, date: reference.date, kind: "calculation",
              message: "Дневные суммы расходятся с независимым пересчётом PostgreSQL",
              actual: day, expected: reference, legacyTotal: null,
            });
          }
          const oldTotal = fromKop(legacy.get(reference.date) ?? 0);
          if (oldTotal !== reference.gross) {
            customerIssues.push({
              customerId, timezone, date: reference.date, kind: "legacy_timezone",
              message: "Прежний алгоритм с текущим смещением часового пояса относил заказы к другому дню",
              actual: day, expected: reference, legacyTotal: oldTotal,
            });
          }
        }
        customersChecked++;
      } catch (error) {
        customerIssues.push({
          customerId, timezone: null, date: null, kind: "customer",
          message: (error as Error).message, actual: null, expected: null, legacyTotal: null,
        });
      }
    }
    return {
      checkedAt: new Date().toISOString(), from, to,
      ordersChecked: snapshot.length,
      pricingRefreshNeeded: snapshot.filter((order) => order.pricingVersion === 0).length,
      discountChecked, legacyOrders, incompletePricing,
      discountIssues,
      customersChecked,
      customerErrors: customerIssues.filter((issue) => issue.kind !== "legacy_timezone").length,
      legacyDateDifferences: customerIssues.filter((issue) => issue.kind === "legacy_timezone").length,
      customerIssues,
      paymentReportAvailable: false,
    };
  }
}
