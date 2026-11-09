import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
export interface ReportState { customerId: string | null; orderId: string | null; from: string; to: string }
const slice = createSlice({
  name: "report",
  initialState: { customerId: null, orderId: null, from: "2026-03-27", to: "2026-03-31" } as ReportState,
  reducers: {
    reportOpened(state, action: PayloadAction<{ customerId: string; orderId: string }>) {
      state.customerId = action.payload.customerId; state.orderId = action.payload.orderId;
    },
    reportClosed(state) { state.customerId = null; state.orderId = null; },
    reportPeriodChanged(state, action: PayloadAction<{ from: string; to: string }>) {
      state.from = action.payload.from; state.to = action.payload.to;
    },
  },
});
export const reportReducer = slice.reducer;
export const { reportOpened, reportClosed, reportPeriodChanged } = slice.actions;
export const selectReport = (state: { report: ReportState }) => state.report;
