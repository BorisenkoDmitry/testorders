import { describe, expect, it } from "vitest";
import { expectedPaidKop, fromKop, parseRub, toKop } from "../src/utils/money.js";

describe("parseRub", () => {
  it("принимает число и строку с числом", () => {
    expect(parseRub(2500)).toBe(2500);
    expect(parseRub("2500.00")).toBe(2500);
    expect(parseRub(" 99 ")).toBe(99);
  });

  it("отклоняет мусор и отрицательные суммы", () => {
    expect(() => parseRub("abc")).toThrow();
    expect(() => parseRub(null)).toThrow();
    expect(() => parseRub(-1)).toThrow();
  });
});

describe("toKop / fromKop", () => {
  it("рубли в копейки", () => {
    expect(toKop(2500)).toBe(250000);
    expect(toKop(99)).toBe(9900);
  });

  it("отбрасывает доли копейки", () => {
    expect(toKop(10.999)).toBe(1099);
  });

  it("копейки в рубли", () => {
    expect(fromKop(250000)).toBe(2500);
    expect(fromKop(1099)).toBe(10.99);
  });
});

describe("денежные регрессии и округление скидки", () => {
  it("не теряет копейку на двоичной дроби", () => {
    expect(toKop(19.99)).toBe(1999);
    expect(toKop(466.99)).toBe(46699);
    expect(toKop(0.29)).toBe(29);
  });
  it("поддерживает десятичные строки и экспоненциальную запись", () => {
    expect(toKop("19.99")).toBe(1999);
    expect(toKop(".29")).toBe(29);
    expect(toKop("1.999e1")).toBe(1999);
    expect(toKop("1e-1000")).toBe(0);
    expect(toKop("10.999")).toBe(1099);
  });
  it("отклоняет пустые значения и переполнение копеек", () => {
    expect(() => toKop(" ")).toThrow();
    expect(() => toKop("90071992547409.92")).toThrow();
  });
  it("проверяет процент с точным округлением половины вверх", () => {
    expect(expectedPaidKop(69700, 33)).toBe(46699);
    expect(expectedPaidKop(1, 50)).toBe(1);
    expect(expectedPaidKop(1999, 12.5)).toBe(1749);
    expect(expectedPaidKop(100, 100)).toBe(0);
    expect(expectedPaidKop(100, 0)).toBe(100);
  });
});
