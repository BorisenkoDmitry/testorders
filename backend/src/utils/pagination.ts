import { z } from "zod";

export const pageLimit = z.coerce.number().int().min(1).max(100).optional();
export const pageOffset = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0);

/** Без limit сохраняем прежний полный ответ; сумма/проверка считаются до среза. */
export function paginate<T>(items: T[], limit?: number, offset = 0) {
  const size = limit ?? items.length;
  return {
    items: items.slice(offset, offset + size),
    pagination: { limit: size, offset, total: items.length, hasMore: offset + size < items.length },
  };
}
