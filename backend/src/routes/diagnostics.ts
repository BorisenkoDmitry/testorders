import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Container } from "../container.js";
import { ValidationError } from "../errors.js";
import { isCalendarDate } from "../utils/time.js";

import { pageLimit, pageOffset, paginate } from "../utils/pagination.js";

const Query = z.object({
  from: z.string(), to: z.string(),
  discountLimit: pageLimit, discountOffset: pageOffset,
  customerLimit: pageLimit, customerOffset: pageOffset,
});

export function diagnosticRoutes(app: FastifyInstance, container: Container) {
  app.get("/diagnostics", async (request) => {
    const query = Query.safeParse(request.query);
    if (!query.success || !isCalendarDate(query.data.from) || !isCalendarDate(query.data.to) ||
        query.data.from > query.data.to) {
      throw new ValidationError("from and to must be valid dates in ascending order");
    }
    const q = query.data;
    if ((q.discountOffset > 0 && q.discountLimit === undefined) ||
        (q.customerOffset > 0 && q.customerLimit === undefined)) {
      throw new ValidationError("A limit (1..100) is required for each non-zero offset");
    }
    const report = await container.diagnostics.run(q.from, q.to);
    const discounts = paginate(report.discountIssues, q.discountLimit, q.discountOffset);
    const customers = paginate(report.customerIssues, q.customerLimit, q.customerOffset);
    return { ...report, discountIssues: discounts.items, discountPagination: discounts.pagination,
      customerIssues: customers.items, customerPagination: customers.pagination };
  });
}
