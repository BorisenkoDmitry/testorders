import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customerReportQuery } from "@/entities/customer";

export function useCustomerReport(customerId: string, active: boolean) {
  const [period, setPeriod] = useState<{ from: string; to: string } | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const query = useQuery({ ...customerReportQuery(customerId, period?.from ?? "", period?.to ?? "", pagination),
    enabled: active && period !== null,
  });
  return { query, pagination, setPagination, period,
    reset: () => setPeriod(null),
    calculate: (from: string, to: string) => {
      if (period?.from === from && period.to === to && pagination.pageIndex === 0) { void query.refetch(); return; }
      setPagination((current) => ({ ...current, pageIndex: 0 })); setPeriod({ from, to });
    },
  };
}
