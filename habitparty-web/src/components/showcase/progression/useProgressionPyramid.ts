"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  getRarityTheme,
  type RarityThemeTokens,
} from "@/constants/achievements";
import {
  type AvatarFrameId,
  resolveAvatarFrameId,
} from "@/constants/avatarFrames";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { FriendConnectionItem } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { type LevelProgress, resolveUserLevelState } from "@/utils/levels";
import {
  buildProgressionPyramidTiers,
  groupFriendsByLevelTier,
  type ProgressionEraId,
  type ProgressionTierView,
  RANK_ERA_ORDER,
  RANK_TIER_METADATA,
  type UserLevelTier,
} from "@/utils/progression";
import { EMPTY_FRIENDS, resolveAchievementCopy } from "@/utils/showcaseUtils";
import { getTierStatus, type TierStatus } from "./tierStatus";

export { EMPTY_FRIENDS };

export interface EraTierGroup {
  eraId: ProgressionEraId;
  tiers: ProgressionTierView[];
}

export interface UseProgressionPyramidParams {
  user: UserResponseDTO;
  stats?: ShowcaseStatsResponseDTO | null;
  achievements: AchievementItemResponseDTO[];
  friends?: FriendConnectionItem[];
  activeFrameId?: AvatarFrameId;
  isVisitorMode?: boolean;
}

export interface UseProgressionPyramidResult {
  isGamified: boolean;
  currentXp: number;
  progress: LevelProgress;
  currentRankOrder: number;
  currentTier: UserLevelTier;
  currentRankTitle: string;
  nextRankTitle: string;
  eraGroups: EraTierGroup[];
  friendsByTier: Map<UserLevelTier, FriendConnectionItem[]>;
  selectedTierView: ProgressionTierView;
  selectedStatus: TierStatus;
  selectTier: (tier: UserLevelTier) => void;
  remainingXpToSelected: number;
  linkedAchievement: AchievementItemResponseDTO | undefined;
  linkedAchievementTheme: RarityThemeTokens | null;
  linkedAchievementCopy: { title: string; description: string } | null;
  displayName: string;
  activeAvatarFrame: AvatarFrameId;
}

export function useProgressionPyramid({
  user,
  stats,
  achievements,
  friends = EMPTY_FRIENDS,
  activeFrameId,
  isVisitorMode = false,
}: UseProgressionPyramidParams): UseProgressionPyramidResult {
  const locale = useLocale() as AppLocale;
  const tCatalog = useTranslations("showcase.catalog");
  const tHeader = useTranslations("showcase.header");
  const { isGamified } = useExperienceMode();

  const { currentXp, progress } = resolveUserLevelState(
    user,
    locale,
    isGamified,
    stats?.totalXp,
  );
  const currentLevel = progress.currentLevel;
  const currentTier = currentLevel.tier;
  const currentRankOrder = RANK_TIER_METADATA[currentTier].rankOrder;

  const [selectedTierOverride, setSelectedTierOverride] =
    useState<UserLevelTier | null>(null);
  const selectedTier = selectedTierOverride ?? currentTier;

  const selectTier = (tier: UserLevelTier) => {
    setSelectedTierOverride(tier === currentTier ? null : tier);
  };

  const { pyramidTiers, eraGroups } = useMemo(() => {
    const tiers = buildProgressionPyramidTiers(locale, isGamified);
    const groupedByEra = new Map<ProgressionEraId, ProgressionTierView[]>();
    for (const tierView of tiers) {
      const bucket = groupedByEra.get(tierView.meta.era);
      if (bucket) {
        bucket.push(tierView);
      } else {
        groupedByEra.set(tierView.meta.era, [tierView]);
      }
    }
    const groups: EraTierGroup[] = [];
    for (const eraId of RANK_ERA_ORDER) {
      const groupTiers = groupedByEra.get(eraId);
      if (groupTiers && groupTiers.length > 0) {
        groups.push({ eraId, tiers: groupTiers });
      }
    }
    return { pyramidTiers: tiers, eraGroups: groups };
  }, [locale, isGamified]);

  const currentTierView =
    pyramidTiers.find((item) => item.entry.tier === currentTier) ??
    pyramidTiers[pyramidTiers.length - 1];
  const nextTierView =
    pyramidTiers.find((item) => item.entry.tier === progress.nextLevel.tier) ??
    currentTierView;

  const currentRankTitle = currentTierView.localizedTitle;
  const nextRankTitle = nextTierView.localizedTitle;

  const selectedTierView =
    pyramidTiers.find((item) => item.entry.tier === selectedTier) ??
    currentTierView;
  const selectedStatus = getTierStatus(
    selectedTierView.meta.rankOrder,
    currentRankOrder,
    selectedTierView.entry.tier === currentTier,
  );

  const remainingXpToSelected = Math.max(0, selectedTierView.minXp - currentXp);

  const friendsByTier = useMemo(
    () =>
      isVisitorMode
        ? new Map<UserLevelTier, FriendConnectionItem[]>()
        : groupFriendsByLevelTier(friends),
    [friends, isVisitorMode],
  );

  const achievementsByCode = useMemo(() => {
    const map = new Map<string, AchievementItemResponseDTO>();
    for (const ach of achievements) {
      map.set(ach.code, ach);
    }
    return map;
  }, [achievements]);

  const linkedAchievement = selectedTierView.meta.achievementCode
    ? achievementsByCode.get(selectedTierView.meta.achievementCode)
    : undefined;
  const linkedAchievementTheme = linkedAchievement
    ? getRarityTheme(linkedAchievement.rarity)
    : null;
  const linkedAchievementCopy = linkedAchievement
    ? resolveAchievementCopy(linkedAchievement, isGamified, tCatalog)
    : null;

  const fallbackName = tHeader(
    isGamified ? "defaultDisplayNameGamified" : "defaultDisplayNameEssential",
  );
  const displayName = user.fullName || user.username || fallbackName;
  const activeAvatarFrame =
    activeFrameId ?? resolveAvatarFrameId(user.avatarFrame);

  return {
    isGamified,
    currentXp,
    progress,
    currentRankOrder,
    currentTier,
    currentRankTitle,
    nextRankTitle,
    eraGroups,
    friendsByTier,
    selectedTierView,
    selectedStatus,
    selectTier,
    remainingXpToSelected,
    linkedAchievement,
    linkedAchievementTheme,
    linkedAchievementCopy,
    displayName,
    activeAvatarFrame,
  };
}
