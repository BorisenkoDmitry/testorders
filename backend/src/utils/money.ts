/** Деньги храним в целых копейках, рубли используем на границах API. */
export function parseRub(raw: unknown): number {
  if (typeof raw === "string" && raw.trim() === "") throw new Error("amount must not be empty");
  const value = typeof raw === "string" ? Number(raw.trim()) : raw;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`invalid amount: ${JSON.stringify(raw)}`);
  }
  return value;
}

/** Десятичное представление без двоичной арифметики с дробной частью. */
function decimalParts(value: number | string) {
  const text = String(value).trim();
  if (!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    throw new Error(`invalid decimal: ${JSON.stringify(value)}`);
  }
  const [mantissa, exponent = "0"] = text.toLowerCase().replace(/^\+/, "").split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  return {
    coefficient: BigInt((whole || "0") + fraction),
    scale: fraction.length - Number(exponent),
  };
}

/** Рубли → копейки. Настоящие доли копейки отбрасываются, как в исходном контракте. */
export function toKop(rub: number | string): number {
  parseRub(rub);
  const { coefficient, scale } = decimalParts(rub);
  if (coefficient === 0n) return 0;
  const shift = 2 - scale;
  if (shift < 0 && -shift >= coefficient.toString().length) return 0;
  const kop = shift >= 0
    ? coefficient * 10n ** BigInt(shift)
    : coefficient / 10n ** BigInt(-shift);
  if (kop > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("amount exceeds safe integer range");
  return Number(kop);
}

/** Ожидаемая оплата по проценту. Округление до ближайшей копейки, половина вверх. */
export function expectedPaidKop(amountKop: number, percent: number): number {
  if (!Number.isSafeInteger(amountKop) || amountKop < 0 ||
      !Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("invalid discount calculation");
  }
  const parts = decimalParts(percent);
  const denominator = parts.scale >= 0 ? 10n ** BigInt(parts.scale) : 1n;
  const numerator = parts.scale >= 0
    ? parts.coefficient
    : parts.coefficient * 10n ** BigInt(-parts.scale);
  const divisor = 100n * denominator;
  const paid = BigInt(amountKop) * (divisor - numerator);
  return Number((paid + divisor / 2n) / divisor);
}

/** amountPaid приоритетен; отсутствие оплаты при наличии процента — явный fallback. */
export function netKop(order: { amountKop: number; amountPaidKop: number | null; discountPercent: number | null }): number {
  if (order.amountPaidKop !== null) return order.amountPaidKop;
  if (order.discountPercent !== null) return expectedPaidKop(order.amountKop, order.discountPercent);
  return order.amountKop;
}

export function fromKop(kop: number): number {
  return kop / 100;
}
