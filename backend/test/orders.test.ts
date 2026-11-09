import { describe, expect, it } from "vitest";
import { apiOrder, postWebhook, setupTestApp } from "./helpers.js";

const ctx = setupTestApp();

describe("страница и список заказов", () => {
  it("отвечает на проверку готовности API", async () => {
    const response = await ctx.app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("возвращает пустую страницу без обращения к внешнему API", async () => {
    const response = await ctx.app.inject({ method: "GET", url: "/orders" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [], total: 0, hasMore: false, limit: 50, offset: 0 });
    expect(ctx.api.calls).toBe(0);
  });

  it("разбивает заказы на страницы с устойчивым порядком", async () => {
    await postWebhook(ctx.app, apiOrder({ id: "a", updatedAt: "2026-02-12T12:00:00Z" }));
    await postWebhook(ctx.app, apiOrder({ id: "b", updatedAt: "2026-02-12T12:00:00Z" }));
    await postWebhook(ctx.app, apiOrder({ id: "c", updatedAt: "2026-02-11T12:00:00Z" }));

    const first = await ctx.app.inject({ method: "GET", url: "/orders?limit=2" });
    expect(first.json().items.map((order: { id: string }) => order.id)).toEqual(["b", "a"]);
    expect(first.json().hasMore).toBe(true);

    const last = await ctx.app.inject({ method: "GET", url: "/orders?limit=2&offset=2" });
    expect(last.json().items.map((order: { id: string }) => order.id)).toEqual(["c"]);
    expect(last.json().hasMore).toBe(false);
    const empty = await ctx.app.inject({ method: "GET", url: "/orders?offset=10" });
    expect(empty.json().items).toEqual([]);
    expect(empty.json().hasMore).toBe(false);
    for (const page of [first, last, empty]) expect(page.json().total).toBe(3);
  });

  it("показывает сохранённое обновление и сумму в рублях", async () => {
    const order = apiOrder({ amount: 100, status: "pending" });
    await postWebhook(ctx.app, order);
    await postWebhook(ctx.app, { ...order, amount: 250.5, status: "paid", updatedAt: "2026-02-12T12:00:00Z" });

    const response = await ctx.app.inject({ method: "GET", url: "/orders" });
    expect(response.json().items).toEqual([{
      id: order.id,
      customerId: "c_1",
      amount: 250.5, amountPaid: 250.5, discount: 0, discountPercent: null,
      status: "paid",
      createdAt: "2026-02-10T12:00:00.000Z",
      updatedAt: "2026-02-12T12:00:00.000Z",
    }]);
  });

  it("возвращает оплату и скидку без подмены фактической оплаты формулой", async () => {
    const cases = [
      { id: "full", amount: 1000, discountPercent: 20, amountPaid: 800, net: 800, discount: 200 },
      { id: "mismatch", amount: 1000, discountPercent: 20, amountPaid: 790, net: 790, discount: 210 },
      { id: "percent", amount: 1000, discountPercent: 25, net: 750, discount: 250 },
      { id: "paid", amount: 1000, amountPaid: 999.99, net: 999.99, discount: 0.01 },
      { id: "legacy", amount: 99, net: 99, discount: 0 },
      { id: "free", amount: 1000, discountPercent: 100, amountPaid: 0, net: 0, discount: 1000 },
    ];
    for (const item of cases) await postWebhook(ctx.app, apiOrder(item));
    const response = (await ctx.app.inject({ method: "GET", url: "/orders" })).json();
    expect(response.total).toBe(cases.length);
    for (const item of cases) expect(response.items.find((order: { id: string }) => order.id === item.id))
      .toMatchObject({ amount: item.amount, amountPaid: item.net, discount: item.discount,
        discountPercent: "discountPercent" in item ? item.discountPercent : null });
  });

  it("считает последнюю полную страницу и сохраняет total за концом списка", async () => {
    for (const id of ["a", "b", "c", "d"]) await postWebhook(ctx.app, apiOrder({ id }));
    const last = (await ctx.app.inject({ method: "GET", url: "/orders?limit=2&offset=2" })).json();
    expect(last).toMatchObject({ total: 4, hasMore: false, limit: 2, offset: 2 });
    expect(last.items.map((order: { id: string }) => order.id)).toEqual(["b", "a"]);
    expect((await ctx.app.inject({ method: "GET", url: "/orders?limit=2&offset=4" })).json())
      .toMatchObject({ total: 4, hasMore: false, items: [] });
  });

  it("отклоняет некорректную пагинацию", async () => {
    for (const query of ["limit=0", "limit=101", "limit=x", "limit=1.5", "offset=-1", "offset=x"]) {
      const response = await ctx.app.inject({ method: "GET", url: "/orders?" + query });
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("bad_request");
    }
  });
});
