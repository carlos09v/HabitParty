"use client";

import { useMemo, useState } from "react";
import type {
  AchievementRarity,
  ProfileHighlightResponseDTO,
} from "@/types/showcase";

export type ShowcaseRarityFilter = "ALL" | AchievementRarity;

interface UseShowcaseGalleryFilterOptions {
  highlights: ProfileHighlightResponseDTO[];
  highlightType: "ACHIEVEMENT" | "ARTIFACT";
  rarities: readonly AchievementRarity[];
  rarityAllLabel: string;
  getRarityLabel: (rarity: AchievementRarity) => string;
}

/**
 * Estado e índices compartilhados entre as galerias de Conquistas e Artefatos:
 * busca textual, filtro de raridade localizado e conjunto O(1) de itens fixados na vitrine.
 */
export function useShowcaseGalleryFilter({
  highlights,
  highlightType,
  rarities,
  rarityAllLabel,
  getRarityLabel,
}: UseShowcaseGalleryFilterOptions) {
  const [rarityFilter, setRarityFilter] = useState<ShowcaseRarityFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const pinnedIdsOrCodes = useMemo(() => {
    const set = new Set<string>();
    for (const h of highlights) {
      if (h.highlightType === highlightType) {
        if (h.referenceId) set.add(h.referenceId);
        if (h.highlightKey) set.add(h.highlightKey);
      }
    }
    return set;
  }, [highlights, highlightType]);

  const isPinned = (id?: string | null, code?: string | null): boolean =>
    Boolean(
      (id && pinnedIdsOrCodes.has(id)) || (code && pinnedIdsOrCodes.has(code)),
    );

  const rarityOptions = useMemo(
    () => [
      { value: "ALL", label: rarityAllLabel },
      ...rarities.map((rarity) => ({
        value: rarity,
        label: getRarityLabel(rarity),
      })),
    ],
    [rarities, rarityAllLabel, getRarityLabel],
  );

  return {
    rarityFilter,
    setRarityFilter,
    searchQuery,
    setSearchQuery,
    pinnedIdsOrCodes,
    isPinned,
    rarityOptions,
  };
}
