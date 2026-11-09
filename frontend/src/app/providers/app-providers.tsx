import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { store } from "../store/store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
    mutations: { retry: 0 },
  },
});
export function AppProviders({ children }: { children: ReactNode }) {
  return <Provider store={store}><QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider></Provider>;
}
