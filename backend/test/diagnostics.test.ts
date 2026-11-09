import { describe, expect, it, vi } from "vitest";
import { apiOrder, dailyTotals, postWebhook, setupTestApp } from "./helpers.js";

const ctx = setupTestApp();
const url = "/diagnostics?from=2026-02-10&to=2026-02-10";

describe("диагностика", () => {
  it("показывает только реальные расхождения скидки и сохраняет фактическую оплату", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    await postWebhook(ctx.app, apiOrder({ id: "valid", amount: 1000, discountPercent: 20, amountPaid: 800 }));
    await postWebhook(ctx.app, apiOrder({ id: "mismatch", amount: 1000, discountPercent: 20, amountPaid: 790 }));
    await postWebhook(ctx.app, apiOrder({ id: "legacy", amount: 100 }));
    await postWebhook(ctx.app, apiOrder({ id: "partial", amount: 100, discountPercent: 25 }));
    const response = await ctx.app.inject({ method: "GET", url });
    expect(response.statusCode).toBe(200);
    const report = response.json();
    expect(report).toMatchObject({
      ordersChecked: 4, discountChecked: 2, legacyOrders: 1, incompletePricing: 1,
      pricingRefreshNeeded: 0, customersChecked: 2, customerErrors: 0, paymentReportAvailable: false,
    });
    expect(report.discountIssues).toHaveLength(1);
    expect(report.discountIssues[0]).toMatchObject({
      orderId: "mismatch", customerId: "c_1", expectedPaid: 800, actualPaid: 790, difference: -10,
    });
    expect((await dailyTotals(ctx.app, "c_1", "2026-02-10", "2026-02-10")).json()[0].net).toBe(1765);
  });

  it("изолирует ошибки клиентов и продолжает остальные проверки", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    ctx.api.customers.set("invalid-zone", "not-a-timezone");
    await postWebhook(ctx.app, apiOrder({ customerId: "missing" }));
    await postWebhook(ctx.app, apiOrder({ customerId: "invalid-zone" }));
    const response = await ctx.app.inject({ method: "GET", url });
    expect(response.statusCode).toBe(200);
    const report = response.json();
    expect(report.customerErrors).toBe(2);
    expect(report.customersChecked).toBe(1);
    expect(report.customerIssues.map((issue: { customerId: string }) => issue.customerId)).toEqual(["invalid-zone", "missing"]);
  });

  it("независимый SQL-пересчёт обнаруживает ошибку агрегатора", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    await postWebhook(ctx.app, apiOrder());
    const original = ctx.container.totals.summarize.bind(ctx.container.totals);
    const spy = vi.spyOn(ctx.container.totals, "summarize").mockImplementation((...args) => {
      const report = original(...args);
      if (args[0] === "c_1") report.daily[0].net += 0.01;
      return report;
    });
    try {
      const report = (await ctx.app.inject({ method: "GET", url })).json();
      expect(report.customerErrors).toBe(1);
      expect(report.customerIssues[0]).toMatchObject({
        kind: "calculation", customerId: "c_1", actual: { net: 1000.01 }, expected: { net: 1000 },
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("отделяет сравнение прежнего алгоритма от ошибок текущего", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    await postWebhook(ctx.app, apiOrder({ customerId: "c_7", amount: 100, createdAt: "2026-03-29T22:30:00Z" }));
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
      const response = await ctx.app.inject({
        method: "GET", url: "/diagnostics?from=2026-03-29&to=2026-03-30",
      });
      const report = response.json();
      expect(report.customerErrors).toBe(0);
      expect(report.legacyDateDifferences).toBe(2);
      expect(report.customerIssues.every((issue: { kind: string }) => issue.kind === "legacy_timezone")).toBe(true);
      expect(report.customerIssues[0]).toMatchObject({
        customerId: "c_7", date: "2026-03-29", legacyTotal: 100, actual: { gross: 0 }, expected: { gross: 0 },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("проверяет один снимок при параллельном поступлении заказов", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    await postWebhook(ctx.app, apiOrder({ id: "before-snapshot" }));
    const original = ctx.api.getCustomer.bind(ctx.api);
    let inserted = false;
    const spy = vi.spyOn(ctx.api, "getCustomer").mockImplementation(async (id) => {
      if (!inserted) {
        inserted = true;
        await postWebhook(ctx.app, apiOrder({ id: "after-snapshot" }));
      }
      return original(id);
    });
    try {
      const report = (await ctx.app.inject({ method: "GET", url })).json();
      expect(report.ordersChecked).toBe(1);
      expect(report.customerErrors).toBe(0);
      expect((await ctx.db.query("SELECT COUNT(*)::int AS count FROM orders")).rows[0].count).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("разбивает оба списка независимо, сохраняя глобальные счётчики", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    for (const id of ["a", "b", "c"]) await postWebhook(ctx.app,
      apiOrder({ id, customerId: "missing-" + id, amount: 1000, discountPercent: 20, amountPaid: 790 }));
    const full = (await ctx.app.inject({ method: "GET", url })).json();
    expect(full.discountIssues).toHaveLength(3);
    expect(full.customerIssues).toHaveLength(3);
    const page = (await ctx.app.inject({ method: "GET", url: url + "&discountLimit=1&discountOffset=1&customerLimit=2&customerOffset=2" })).json();
    expect(page).toMatchObject({ ordersChecked: 3, discountChecked: 3, customerErrors: 3, customersChecked: 1,
      discountPagination: { limit: 1, offset: 1, total: 3, hasMore: true },
      customerPagination: { limit: 2, offset: 2, total: 3, hasMore: false } });
    expect(page.discountIssues).toEqual(full.discountIssues.slice(1, 2));
    expect(page.customerIssues).toEqual(full.customerIssues.slice(2));
    const empty = (await ctx.app.inject({ method: "GET", url: url + "&discountLimit=1&discountOffset=3&customerLimit=1&customerOffset=20" })).json();
    expect(empty).toMatchObject({ discountIssues: [], customerIssues: [], customerErrors: 3,
      discountPagination: { total: 3, hasMore: false }, customerPagination: { total: 3, hasMore: false } });
  });

  it("отклоняет некорректные страницы диагностик", async () => {
    for (const query of ["discountLimit=0", "discountLimit=101", "discountLimit=x", "discountOffset=1",
      "discountLimit=1&discountOffset=-1", "customerLimit=101", "customerOffset=1", "customerLimit=1.5", "customerLimit=1&customerOffset=x"]) {
      expect((await ctx.app.inject({ method: "GET", url: url + "&" + query })).statusCode).toBe(400);
    }
  });

  it("проверяет пустые данные и валидирует период", async () => {
    ctx.api.customers.set("c_7", "Europe/Berlin");
    const report = (await ctx.app.inject({ method: "GET", url })).json();
    expect(report).toMatchObject({ ordersChecked: 0, customersChecked: 1, customerErrors: 0, discountIssues: [] });
    for (const query of ["", "?from=2026-02-11&to=2026-02-10", "?from=2026-13-01&to=2026-13-02"]) {
      expect((await ctx.app.inject({ method: "GET", url: "/diagnostics" + query })).statusCode).toBe(400);
    }
  });
});
