import { create } from "zustand";
import { DEFAULT_DASHBOARD_ADVANCED_FILTERS } from "@/constants/dashboard";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import type { TaskFilterType } from "@/types/task";

interface DashboardFilterStoreState {
  activeFilter: TaskFilterType;
  selectedDate: string | null;
  mobileDrawerCloseSeq: number;
  advancedFilters: DashboardAdvancedFilters;
  setFilter: (filter: TaskFilterType) => void;
  setSelectedDate: (date: string | null) => void;
  requestMobileDrawerClose: () => void;
  setAdvancedFilters: (
    updater:
      | DashboardAdvancedFilters
      | ((prev: DashboardAdvancedFilters) => DashboardAdvancedFilters),
  ) => void;
  resetAdvancedFilters: () => void;
}

export const useDashboardFilterStore = create<DashboardFilterStoreState>(
  (set) => ({
    activeFilter: "today",
    selectedDate: null,
    mobileDrawerCloseSeq: 0,
    advancedFilters: DEFAULT_DASHBOARD_ADVANCED_FILTERS,
    setFilter: (activeFilter) => set({ activeFilter, selectedDate: null }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    requestMobileDrawerClose: () =>
      set((state) => ({
        mobileDrawerCloseSeq: state.mobileDrawerCloseSeq + 1,
      })),
    setAdvancedFilters: (updater) =>
      set((state) => ({
        advancedFilters:
          typeof updater === "function"
            ? updater(state.advancedFilters)
            : updater,
      })),
    resetAdvancedFilters: () =>
      set({ advancedFilters: DEFAULT_DASHBOARD_ADVANCED_FILTERS }),
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
  params.delete("page");
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
}
