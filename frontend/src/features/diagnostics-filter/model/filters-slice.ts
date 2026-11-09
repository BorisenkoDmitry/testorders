import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
export interface Period { from: string; to: string }
export interface DiagnosticFilters { draft: Period; applied: Period }
const initialPeriod = { from: "2026-03-27", to: "2026-03-31" };
const slice = createSlice({
  name: "diagnosticFilters",
  initialState: { draft: initialPeriod, applied: initialPeriod } as DiagnosticFilters,
  reducers: {
    periodEdited(state, action: PayloadAction<Period>) { state.draft = action.payload; },
    periodApplied(state) { state.applied = state.draft; },
  },
});
export const diagnosticFiltersReducer = slice.reducer;
export const { periodEdited, periodApplied } = slice.actions;
export const selectDiagnosticFilters = (state: { diagnosticFilters: DiagnosticFilters }) => state.diagnosticFilters;
