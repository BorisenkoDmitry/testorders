import { describe, expect, it } from "vitest";
import { apiOrder, dailyTotals, postWebhook, setupTestApp } from "./helpers.js";

const ctx = setupTestApp();

const reportUrl = (customerId: string, from: string, to: string) =>
  `/customers/${customerId}/daily-totals?from=${from}&to=${to}&includeOrders=true`;

describe("расчёт с перечнем заказов", () => {
  it("включает только оплаченные заказы выбранного клиента и периода", async () => {
    await postWebhook(ctx.app, apiOrder({ id: "start", amount: 100.25, createdAt: "2026-02-09T21:00:00Z" }));
    await postWebhook(ctx.app, apiOrder({ id: "end", amount: 250.5, createdAt: "2026-02-11T20:59:59Z" }));
    await postWebhook(ctx.app, apiOrder({ id: "before", createdAt: "2026-02-09T20:59:59Z" }));
    await postWebhook(ctx.app, apiOrder({ id: "after", createdAt: "2026-02-11T21:00:00Z" }));
    await postWebhook(ctx.app, apiOrder({ status: "pending" }));
    await postWebhook(ctx.app, apiOrder({ status: "refunded" }));
    await postWebhook(ctx.app, apiOrder({ customerId: "c_2" }));

    const response = await ctx.app.inject({
      method: "GET", url: reportUrl("c_1", "2026-02-10", "2026-02-11"),
    });
    expect(response.statusCode).toBe(200);
    const report = response.json();
    expect(report).toMatchObject({
      customerId: "c_1",
      timezone: "Europe/Moscow",
      from: "2026-02-10",
      to: "2026-02-11",
      total: 350.75,
      daily: [
        { date: "2026-02-10", total: 100.25, gross: 100.25, discount: 0, net: 100.25 },
        { date: "2026-02-11", total: 250.5, gross: 250.5, discount: 0, net: 250.5 },
      ],
    });
    expect(report.orders.map((order: { id: string }) => order.id)).toEqual(["start", "end"]);
    expect(report.orders.map((order: { date: string }) => order.date)).toEqual(["2026-02-10", "2026-02-11"]);
    expect(report.orders.every((order: { status: string; customerId: string }) =>
      order.status === "paid" && order.customerId === "c_1")).toBe(true);
    expect(report.orders.reduce((sum: number, order: { amount: number }) =>
      sum + Math.round(order.amount * 100), 0)).toBe(Math.round(report.total * 100));
    expect((await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-11")).json()).toEqual(report.daily);
  });

  it("показывает нулевую сумму и пустой список", async () => {
    const response = await ctx.app.inject({
      method: "GET", url: reportUrl("c_1", "2026-02-10", "2026-02-10"),
    });
    expect(response.json()).toMatchObject({
      total: 0,
      orders: [],
      daily: [{ date: "2026-02-10", total: 0, gross: 0, discount: 0, net: 0 }],
    });
  });

  it("сохраняет обычный формат ответа при includeOrders=false", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/customers/c_1/daily-totals?from=2026-02-10&to=2026-02-10&includeOrders=false",
    });
    expect(response.json()).toEqual([{ date: "2026-02-10", total: 0, gross: 0, discount: 0, net: 0 }]);
  });

  it("страницы детализации не меняют полные итоги периода", async () => {
    for (const id of ["a", "b", "c"]) await postWebhook(ctx.app,
      apiOrder({ id, amount: 1000, discountPercent: 20, amountPaid: 800 }));
    const base = reportUrl("c_1", "2026-02-10", "2026-02-10");
    const full = (await ctx.app.inject({ method: "GET", url: base })).json();
    expect(full.orders).toHaveLength(3);
    for (const offset of [0, 1, 2, 3, 99]) {
      const page = (await ctx.app.inject({ method: "GET", url: base + "&ordersLimit=1&ordersOffset=" + offset })).json();
      expect(page).toMatchObject({ gross: 3000, total: 3000, net: 2400, discount: 600,
        ordersPagination: { limit: 1, offset, total: 3, hasMore: offset < 2 } });
      expect(page.daily).toEqual(full.daily);
      expect(page.orders.map((order: { id: string }) => order.id)).toEqual(full.orders.slice(offset, offset + 1).map((order: { id: string }) => order.id));
      if (page.orders[0]) expect(page.orders[0]).toMatchObject({ amount: 1000, amountPaid: 800, discount: 200 });
    }
  });

  it("отклоняет неверные параметры страниц отчёта", async () => {
    const base = reportUrl("c_1", "2026-02-10", "2026-02-10");
    for (const query of ["ordersLimit=0", "ordersLimit=101", "ordersLimit=x", "ordersLimit=1.5", "ordersOffset=-1", "ordersOffset=2", "ordersLimit=1&ordersOffset=x"]) {
      expect((await ctx.app.inject({ method: "GET", url: base + "&" + query })).statusCode).toBe(400);
    }
    expect((await ctx.app.inject({ method: "GET", url: base.replace("includeOrders=true", "includeOrders=false") + "&ordersLimit=1" })).statusCode).toBe(400);
  });

  it("валидирует даты и параметр детализации", async () => {
    for (const query of [
      "from=2026-02-11&to=2026-02-10&includeOrders=true",
      "from=2026-13-01&to=2026-13-02&includeOrders=true",
      "from=2026-02-30&to=2026-03-01&includeOrders=true",
      "from=2026-02-10&includeOrders=true",
      "from=2026-02-10&to=2026-02-10&includeOrders=other",
    ]) {
      const response = await ctx.app.inject({
        method: "GET", url: "/customers/c_1/daily-totals?" + query,
      });
      expect(response.statusCode).toBe(400);
    }
  });

  it("возвращает 404 для неизвестного клиента", async () => {
    const response = await ctx.app.inject({
      method: "GET", url: reportUrl("unknown", "2026-02-10", "2026-02-10"),
    });
    expect(response.statusCode).toBe(404);
  });
});
