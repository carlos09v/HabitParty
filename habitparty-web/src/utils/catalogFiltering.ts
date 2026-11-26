import {
  REWARD_CATEGORY_FILTER_VALUES,
  REWARD_PACKAGE_FILTER_VALUES,
  REWARD_TYPE_FILTER_VALUES,
} from "@/constants/reward";
import type { ItemCatalogFilterState, SelectOption } from "@/types/ui";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";

export type CatalogTypeLabelKey =
  | "SingleUse"
  | "TimeBased"
  | "MysteryBox"
  | "MysteryBoxProductivity";

interface CatalogOptionsTranslators {
  allLabel: string;
  isGamified: boolean;
  getTypeLabel: (typeKey: CatalogTypeLabelKey) => string;
  getCategoryLabel: (
    categoryKey: ReturnType<typeof toCategoryMessageKey>,
  ) => string;
  getPackageLabel?: (
    packageKey: ReturnType<typeof toPackageMessageKey>,
  ) => string;
}

/**
 * Constrói opções padronizadas de filtro de Tipo compartilhadas entre Loja e Mochila.
 */
export function buildCatalogTypeOptions({
  allLabel,
  isGamified,
  getTypeLabel,
}: Pick<
  CatalogOptionsTranslators,
  "allLabel" | "isGamified" | "getTypeLabel"
>): SelectOption[] {
  return REWARD_TYPE_FILTER_VALUES.map((val) => {
    if (!val) {
      return { value: val, label: allLabel };
    }
    const resolvedKey: CatalogTypeLabelKey =
      val === "MysteryBox" && !isGamified ? "MysteryBoxProductivity" : val;
    return {
      value: val,
      label: getTypeLabel(resolvedKey),
    };
  });
}

/**
 * Constrói opções padronizadas de filtro de Categoria compartilhadas entre Loja e Mochila.
 */
export function buildCatalogCategoryOptions({
  allLabel,
  getCategoryLabel,
  excludeDebt = false,
}: Pick<CatalogOptionsTranslators, "allLabel" | "getCategoryLabel"> & {
  excludeDebt?: boolean;
}): SelectOption[] {
  const values = excludeDebt
    ? REWARD_CATEGORY_FILTER_VALUES.filter((val) => val !== "Dívida")
    : REWARD_CATEGORY_FILTER_VALUES;

  return values.map((val) => ({
    value: val,
    label: val ? getCategoryLabel(toCategoryMessageKey(val)) : allLabel,
  }));
}

/**
 * Constrói opções padronizadas de filtro de Pacote/Raridade compartilhadas entre Loja e Mochila.
 */
export function buildCatalogPackageOptions({
  allLabel,
  getPackageLabel,
}: {
  allLabel: string;
  getPackageLabel: (
    packageKey: ReturnType<typeof toPackageMessageKey>,
  ) => string;
}): SelectOption[] {
  return REWARD_PACKAGE_FILTER_VALUES.map((val) => ({
    value: val,
    label: val ? getPackageLabel(toPackageMessageKey(val)) : allLabel,
  }));
}

export interface CatalogFilterableItem {
  title: string;
  description?: string | null;
  type: string;
  category?: string | null;
  packageLevel?: string | null;
}

/**
 * Predicado compartilhado de filtragem por busca textual, tipo, categoria e nível de pacote.
 */
export function matchesCatalogSearchAndMeta(
  item: CatalogFilterableItem,
  filters: Pick<
    ItemCatalogFilterState,
    "search" | "type" | "category" | "packageLevel"
  >,
): boolean {
  const normalizedSearch = filters.search.trim().toLowerCase();
  if (normalizedSearch) {
    const titleMatch = item.title.toLowerCase().includes(normalizedSearch);
    const descMatch = item.description
      ? item.description.toLowerCase().includes(normalizedSearch)
      : false;
    if (!titleMatch && !descMatch) {
      return false;
    }
  }

  if (filters.type) {
    if (
      toRewardTypeMessageKey(item.type) !== toRewardTypeMessageKey(filters.type)
    ) {
      return false;
    }
  }

  if (filters.category) {
    if (
      toCategoryMessageKey(item.category) !==
      toCategoryMessageKey(filters.category)
    ) {
      return false;
    }
  }

  if (filters.packageLevel) {
    if (
      toPackageMessageKey(item.packageLevel) !==
      toPackageMessageKey(filters.packageLevel)
    ) {
      return false;
    }
  }

  return true;
}
