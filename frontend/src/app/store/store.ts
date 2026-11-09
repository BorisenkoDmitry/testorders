import { configureStore } from "@reduxjs/toolkit";
import { reportReducer } from "@/features/customer-report";
import { ordersViewReducer } from "@/features/order-pagination";
import { diagnosticFiltersReducer } from "@/features/diagnostics-filter";

export const store = configureStore({
  reducer: { report: reportReducer, ordersView: ordersViewReducer, diagnosticFilters: diagnosticFiltersReducer },
});
