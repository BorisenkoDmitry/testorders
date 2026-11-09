import type { Db } from "../db.js";

export interface Order {
  id: string;
  customerId: string;
  amountKop: number;
  amountPaidKop: number | null;
  discountPercent: number | null;
  pricingVersion: number;
  status: "pending" | "paid" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

interface Row {
  id: string;
  customer_id: string;
  amount_kop: string;
  amount_paid_kop: string | null;
  discount_percent: string | null;
  pricing_version: number;
  status: Order["status"];
  created_at: Date;
  updated_at: Date;
}

const fromRow = (row: Row): Order => ({
  id: row.id,
  customerId: row.customer_id,
  amountKop: Number(row.amount_kop),
  amountPaidKop: row.amount_paid_kop === null ? null : Number(row.amount_paid_kop),
  discountPercent: row.discount_percent === null ? null : Number(row.discount_percent),
  pricingVersion: row.pricing_version,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class OrdersRepository {
  constructor(private readonly db: Db) {}

  async all(): Promise<Order[]> {
    const { rows } = await this.db.query<Row>("SELECT * FROM orders ORDER BY id");
    return rows.map(fromRow);
  }

  async list(limit: number, offset: number): Promise<{ orders: Order[]; total: number }> {
    const client = await this.db.connect();
    try {
      // Страница и её размер относятся к одному снимку даже во время sync.
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const count = await client.query<{ total: string }>("SELECT count(*) AS total FROM orders");
      const { rows } = await client.query<Row>(
        "SELECT * FROM orders ORDER BY updated_at DESC, id DESC LIMIT $1 OFFSET $2", [limit, offset],
      );
      await client.query("COMMIT");
      return { orders: rows.map(fromRow), total: Number(count.rows[0].total) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async get(id: string): Promise<Order | null> {
    const { rows } = await this.db.query<Row>("SELECT * FROM orders WHERE id = $1", [id]);
    return rows[0] ? fromRow(rows[0]) : null;
  }

  /** Проверка версии и сохранение атомарны даже при одновременных sync и вебхуках. */
  async save(order: Order): Promise<"created" | "updated" | "stale"> {
    const { rows } = await this.db.query<{ inserted: boolean }>(
      `INSERT INTO orders
         (id, customer_id, amount_kop, amount_paid_kop, discount_percent, pricing_version,
          status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         customer_id = excluded.customer_id,
         amount_kop = excluded.amount_kop,
         amount_paid_kop = excluded.amount_paid_kop,
         discount_percent = excluded.discount_percent,
         pricing_version = excluded.pricing_version,
         status = excluded.status,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at
       WHERE orders.updated_at < excluded.updated_at
          OR (orders.updated_at = excluded.updated_at AND orders.pricing_version < excluded.pricing_version)
       RETURNING (xmax = 0) AS inserted`,
      [order.id, order.customerId, order.amountKop, order.amountPaidKop, order.discountPercent,
        order.status, order.createdAt, order.updatedAt],
    );
    if (!rows[0]) return "stale";
    return rows[0].inserted ? "created" : "updated";
  }

  /** Оплаченные заказы клиента, созданные в [from, to). */
  async paidCreatedBetween(customerId: string, from: Date, to: Date): Promise<Order[]> {
    const { rows } = await this.db.query<Row>(
      `SELECT * FROM orders
       WHERE customer_id = $1 AND status = 'paid' AND created_at >= $2 AND created_at < $3`,
      [customerId, from, to],
    );
    return rows.map(fromRow);
  }
}
