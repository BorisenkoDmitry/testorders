import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";
import { ValidationError } from "../errors.js";
import { isCalendarDate } from "../utils/time.js";

import { pageLimit, pageOffset } from "../utils/pagination.js";

const Query = z.object({
  from: z.string(),
  to: z.string(),
  includeOrders: z.enum(["true", "false"]).optional(),
  ordersLimit: pageLimit, ordersOffset: pageOffset,
});

export function customerRoutes(app: FastifyInstance, c: Container) {
  app.get<{ Params: { id: string } }>("/customers/:id/daily-totals", async (req) => {
    const q = Query.safeParse(req.query);
    if (!q.success || !isCalendarDate(q.data.from) || !isCalendarDate(q.data.to)) {
      throw new ValidationError("from and to must be valid dates (YYYY-MM-DD); includeOrders must be true or false");
    }
    if (q.data.from > q.data.to) throw new ValidationError("from must be <= to");
    if ((q.data.ordersOffset > 0 && q.data.ordersLimit === undefined) ||
        ((q.data.ordersLimit !== undefined || q.data.ordersOffset > 0) && q.data.includeOrders !== "true")) {
      throw new ValidationError("ordersLimit (1..100) and includeOrders=true are required for pagination");
    }
    if (q.data.includeOrders === "true") {
      return c.totals.report(req.params.id, q.data.from, q.data.to, q.data.ordersLimit, q.data.ordersOffset);
    }
    return c.totals.daily(req.params.id, q.data.from, q.data.to);
  });
}
