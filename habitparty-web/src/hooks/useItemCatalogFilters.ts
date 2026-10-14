"use client";

import { useMemo, useState } from "react";
import { useViewMode } from "@/hooks/useViewMode";

export interface ItemCatalogFilterState {
  search: string;
  type: string;
  category: string;
  tag: string;
  packageLevel: string;
}

const DEFAULT_FILTERS: ItemCatalogFilterState = {
  search: "",
  type: "",
  category: "",
  tag: "",
  packageLevel: "",
};

export function useItemCatalogFilters(storageKey: "rewards" | "inventory") {
  const [viewMode, setViewMode] = useViewMode(storageKey, "card");
  const [filters, setFilters] =
    useState<ItemCatalogFilterState>(DEFAULT_FILTERS);

  const handleFilterChange = (partial: Partial<ItemCatalogFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const isFiltering = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.type ||
        filters.category ||
        filters.tag ||
        filters.packageLevel,
    );
  }, [filters]);

  return {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  };
}
