import { create } from "zustand";
import type { TaskFilterType } from "@/types/task";

interface DashboardFilterStoreState {
  activeFilter: TaskFilterType;
  selectedDate: string | null;
  setFilter: (filter: TaskFilterType) => void;
  setSelectedDate: (date: string | null) => void;
}

export const useDashboardFilterStore = create<DashboardFilterStoreState>(
  (set) => ({
    activeFilter: "today",
    selectedDate: null,
    setFilter: (activeFilter) => set({ activeFilter, selectedDate: null }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
  }),
);

export function syncDashboardFilterUrl(
  nextFilter: TaskFilterType,
  nextDate: string | null,
) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (nextDate) {
    params.set("date", nextDate);
  } else {
    params.delete("date");
  }
  params.set("filter", nextFilter);
  params.set("page", "1");
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
}
