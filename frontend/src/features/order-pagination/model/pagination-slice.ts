import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PageRequest } from "@/shared/api/pagination";
const slice = createSlice({
  name: "ordersView", initialState: { pageIndex: 0, pageSize: 50 } as PageRequest,
  reducers: { pageChanged: (_state, action: PayloadAction<PageRequest>) => action.payload },
});
export const ordersViewReducer = slice.reducer;
export const { pageChanged } = slice.actions;
export const selectOrdersPage = (state: { ordersView: PageRequest }) => state.ordersView;
