import { describe, expect, it, vi } from "vitest";
import { apiOrder, dailyTotals, postWebhook, setupTestApp } from "./helpers.js";

const ctx = setupTestApp();

describe("скидки и версии заказов", () => {
  it("сохраняет скидки из sync и вебхуков, считает gross/net/discount в копейках", async () => {
    ctx.api.pages.set(null, { items: [
      apiOrder({ amount: 697, discountPercent: 33, amountPaid: "466.99" }),
      apiOrder({ amount: 1000, discountPercent: "20", amountPaid: 800 }),
    ], nextCursor: null });
    expect((await ctx.app.inject({ method: "POST", url: "/sync" })).statusCode).toBe(200);
    await postWebhook(ctx.app, apiOrder({ amount: "19.99", discountPercent: 0, amountPaid: "19.99" }));
    const response = await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10");
    expect(response.json()).toEqual([{
      date: "2026-02-10", total: 1716.99, gross: 1716.99, net: 1286.98, discount: 430.01,
    }]);
  });

  it("поддерживает старый формат, нулевую оплату и частичные поля скидки", async () => {
    await postWebhook(ctx.app, apiOrder({ amount: 100 }));
    await postWebhook(ctx.app, apiOrder({ amount: 100, discountPercent: 100, amountPaid: 0 }));
    await postWebhook(ctx.app, apiOrder({ amount: 100, discountPercent: 25 }));
    await postWebhook(ctx.app, apiOrder({ amount: 100, amountPaid: 90 }));
    const response = await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10");
    expect(response.json()).toEqual([{
      date: "2026-02-10", total: 400, gross: 400, net: 265, discount: 135,
    }]);
  });

  it("догружает скидки в существующие записи при одинаковой версии один раз", async () => {
    const order = apiOrder({ id: "legacy", amount: 19.99, discountPercent: 0, amountPaid: 19.99 });
    await ctx.db.query(
      `INSERT INTO orders (id, customer_id, amount_kop, status, created_at, updated_at)
       VALUES ($1, $2, 1998, 'paid', $3, $4)`,
      [order.id, order.customerId, order.createdAt, order.updatedAt],
    );
    expect((await postWebhook(ctx.app, order)).json()).toEqual({ result: "updated" });
    expect((await postWebhook(ctx.app, order)).json()).toEqual({ result: "stale" });
    const { rows } = await ctx.db.query("SELECT amount_kop, amount_paid_kop, pricing_version FROM orders WHERE id='legacy'");
    expect(rows[0]).toEqual({ amount_kop: "1999", amount_paid_kop: "1999", pricing_version: 1 });
  });

  it("не откатывает новую оплату устаревшим событием", async () => {
    const order = apiOrder({ amount: 1000, discountPercent: 10, amountPaid: 900 });
    await postWebhook(ctx.app, order);
    await postWebhook(ctx.app, { ...order, discountPercent: 20, amountPaid: 800, updatedAt: "2026-02-11T12:00:00Z" });
    expect((await postWebhook(ctx.app, order)).json()).toEqual({ result: "stale" });
    const { rows } = await ctx.db.query("SELECT amount_paid_kop, discount_percent FROM orders WHERE id=$1", [order.id]);
    expect(Number(rows[0].amount_paid_kop)).toBe(80000);
    expect(Number(rows[0].discount_percent)).toBe(20);
  });

  it("атомарно применяет конкурирующие версии и повторы", async () => {
    const order = apiOrder({ id: "race" });
    const responses = await Promise.all([11, 13, 10, 12].map((day) =>
      postWebhook(ctx.app, { ...order, amountPaid: day, updatedAt: `2026-02-${day}T12:00:00Z` })));
    expect(responses.every((response) => response.statusCode === 200)).toBe(true);
    const { rows } = await ctx.db.query("SELECT amount_paid_kop, updated_at FROM orders WHERE id='race'");
    expect(rows[0].amount_paid_kop).toBe("1300");
    expect(rows[0].updated_at.toISOString()).toBe("2026-02-13T12:00:00.000Z");

    const duplicate = apiOrder({ id: "duplicate", amountPaid: 1000, discountPercent: 0 });
    const results = await Promise.all(Array.from({ length: 5 }, () => postWebhook(ctx.app, duplicate)));
    expect(results.filter((response) => response.json().result === "created")).toHaveLength(1);
    expect(results.filter((response) => response.json().result === "stale")).toHaveLength(4);
  });

  it("отклоняет некорректные денежные поля и проценты", async () => {
    for (const fields of [
      { discountPercent: -1 }, { discountPercent: 101 }, { discountPercent: "" },
      { amountPaid: -1 }, { amountPaid: "abc" }, { amountPaid: "" }, { amountPaid: null },
    ]) {
      expect((await postWebhook(ctx.app, apiOrder(fields))).statusCode).toBe(400);
    }
  });
});

describe("дни в Europe/Berlin на переходе летнего времени", () => {
  it("считает по времени заказа и не зависит от даты запуска сервера", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    const times = [
      "2026-03-26T23:00:00Z", "2026-03-27T23:00:00Z", "2026-03-28T23:00:00Z",
      "2026-03-29T22:00:00Z", "2026-03-30T22:00:00Z",
    ];
    for (const [index, createdAt] of times.entries()) {
      await postWebhook(ctx.app, apiOrder({
        customerId: "c_7", amount: (index + 1) * 100, amountPaid: (index + 1) * 80,
        discountPercent: 20, createdAt,
      }));
    }
    await postWebhook(ctx.app, apiOrder({ customerId: "c_7", createdAt: "2026-03-26T22:59:59Z" }));
    await postWebhook(ctx.app, apiOrder({ customerId: "c_7", createdAt: "2026-03-31T22:00:00Z" }));
    const expected = times.map((_, index) => ({
      date: `2026-03-${27 + index}`,
      total: (index + 1) * 100, gross: (index + 1) * 100,
      discount: (index + 1) * 20, net: (index + 1) * 80,
    }));
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
      expect((await dailyTotals(ctx.app, "c_7", "2026-03-27", "2026-03-31")).json()).toEqual(expected);
      vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
      expect((await dailyTotals(ctx.app, "c_7", "2026-03-27", "2026-03-31")).json()).toEqual(expected);
    } finally {
      vi.useRealTimers();
    }
  });
});
