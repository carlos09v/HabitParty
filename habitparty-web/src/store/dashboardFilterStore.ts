import { create } from "zustand";
import {
  type ActivityPeriodOption,
  DASHBOARD_ITEMS_PER_PAGE,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
} from "@/constants/dashboard";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import type { TaskFilterType } from "@/types/task";
import { replaceUrlSearchParams } from "@/utils/urlParams";

interface DashboardFilterStoreState {
  activeFilter: TaskFilterType;
  selectedDate: string | null;
  searchQuery: string;
  itemsPerPage: number;
  mobileDrawerCloseSeq: number;
  advancedFilters: DashboardAdvancedFilters;
  calendarWeekOffset: number;
  activityPeriod: ActivityPeriodOption;
  setFilter: (filter: TaskFilterType) => void;
  setSelectedDate: (date: string | null) => void;
  hydrateFromUrl: (filter: TaskFilterType, date: string | null) => void;
  setSearchQuery: (query: string) => void;
  setItemsPerPage: (size: number) => void;
  requestMobileDrawerClose: () => void;
  setAdvancedFilters: (
    updater:
      | DashboardAdvancedFilters
      | ((prev: DashboardAdvancedFilters) => DashboardAdvancedFilters),
  ) => void;
  resetAdvancedFilters: () => void;
  setCalendarWeekOffset: (updater: number | ((prev: number) => number)) => void;
  setActivityPeriod: (period: ActivityPeriodOption) => void;
  resetAll: () => void;
}

export const useDashboardFilterStore = create<DashboardFilterStoreState>(
  (set) => ({
    activeFilter: "today",
    selectedDate: null,
    searchQuery: "",
    itemsPerPage: DASHBOARD_ITEMS_PER_PAGE,
    mobileDrawerCloseSeq: 0,
    advancedFilters: DEFAULT_DASHBOARD_ADVANCED_FILTERS,
    calendarWeekOffset: 0,
    activityPeriod: "today",
    setFilter: (activeFilter) => set({ activeFilter, selectedDate: null }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    hydrateFromUrl: (activeFilter, selectedDate) =>
      set({ activeFilter, selectedDate }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
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
    setCalendarWeekOffset: (updater) =>
      set((state) => ({
        calendarWeekOffset:
          typeof updater === "function"
            ? updater(state.calendarWeekOffset)
            : updater,
      })),
    setActivityPeriod: (activityPeriod) => set({ activityPeriod }),
    resetAll: () =>
      set({
        activeFilter: "today",
        selectedDate: null,
        searchQuery: "",
        itemsPerPage: DASHBOARD_ITEMS_PER_PAGE,
        advancedFilters: DEFAULT_DASHBOARD_ADVANCED_FILTERS,
        calendarWeekOffset: 0,
        activityPeriod: "today",
      }),
  }),
);

export function syncDashboardFilterUrl(
  nextFilter: TaskFilterType,
  nextDate: string | null,
) {
  replaceUrlSearchParams((params) => {
    if (nextDate) {
      params.set("date", nextDate);
    } else {
      params.delete("date");
    }
    params.set("filter", nextFilter);
    params.delete("page");
  });
}
