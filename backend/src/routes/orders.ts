import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";
import { ValidationError } from "../errors.js";

const Query = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
});

export function orderRoutes(app: FastifyInstance, c: Container) {
  app.get("/orders", async (req) => {
    const query = Query.safeParse(req.query);
    if (!query.success) throw new ValidationError("limit must be 1..100 and offset must be a non-negative integer");
    const { limit, offset } = query.data;
    return { ...await c.orders.list(limit, offset), limit, offset };
  });
}
