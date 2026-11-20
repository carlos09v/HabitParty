"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { resolveProfileTitleLabel } from "@/constants/cosmetics";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
  AchievementRarity,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
  TaskStreakHighlightDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import {
  resolveHighlightSlotCard,
  resolveRetrospectiveViewMeta,
  resolveUserLevelState,
} from "@/utils";
import type { ProfileCardRenderInput } from "@/utils/profileCardRenderer";

const RARITY_HEX: Record<AchievementRarity, string> = {
  COMMON: "#94A3B8",
  UNCOMMON: "#10B981",
  RARE: "#38BDF8",
  EPIC: "#A855F7",
  LEGENDARY: "#FACC15",
};

export interface ProfilePreviewCardUser {
  id?: string | null;
  fullName?: string | null;
  username?: string | null;
  profilePhotoUrl?: string | null;
  bio?: string | null;
  isPremium?: boolean | null;
  isFounder?: boolean | null;
  avatarFrame?: string | null;
  avatarPreset?: string | null;
  equippedTitle?: string | null;
  friendCode?: string | null;
  totalXp?: number | null;
  currentLevel?: number | null;
  currentLevelTitle?: string | null;
  nextLevelTitle?: string | null;
  xpToNextLevel?: number | null;
}

interface UseProfileCardRenderInputParams {
  mode: "profile" | "retrospective";
  theme: "dark" | "light";
  isGamified: boolean;
  user: ProfilePreviewCardUser;
  stats?: ShowcaseStatsResponseDTO | null;
  highlights?: ProfileHighlightResponseDTO[];
  achievements?: AchievementItemResponseDTO[];
  artifacts?: ArtifactItemResponseDTO[];
  taskStreaks?: TaskStreakHighlightDTO[];
  retrospective?: UserRetrospectiveData | null;
  activeFrameId?: string | null;
  includeFriendCode: boolean;
}

export function useProfileCardRenderInput({
  mode,
  theme,
  isGamified,
  user,
  stats,
  highlights = [],
  achievements = [],
  artifacts = [],
  taskStreaks = [],
  retrospective = null,
  activeFrameId,
  includeFriendCode,
}: UseProfileCardRenderInputParams): ProfileCardRenderInput {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("showcase.previewCard");
  const tRetro = useTranslations("showcase.retrospective");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const tBadges = useTranslations("showcase.accountBadges");
  const tHighlights = useTranslations("showcase.highlights");
  const tArtifacts = useTranslations("showcase.artifacts");
  const tTitles = useTranslations("showcase.titles");

  const levelState = useMemo(
    () => resolveUserLevelState(user, locale, isGamified, stats?.totalXp ?? 0),
    [user, locale, isGamified, stats?.totalXp],
  );

  return useMemo(() => {
    const resolvedHighlights = highlights
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 4)
      .map((item) => {
        const card = resolveHighlightSlotCard(item, {
          achievements,
          artifacts,
          taskStreaks,
          stats,
          isGamified,
          levelTitle: levelState.levelTitle,
          currentXp: levelState.currentXp,
          tCatalog,
          tBadges,
          tArtifacts,
          tHighlights,
        });
        if (!card) return null;
        return {
          title: card.title,
          badge: `${tHighlights(`typeBadge.${item.highlightType}`)} • ${tRarities(card.rarity)}`,
          accentHex: RARITY_HEX[card.rarity] || "#38BDF8",
        };
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);

    const {
      bestMonthName: bestMonthLabel,
      archetypeTitle,
      archetypeDesc,
      rarestTitle: rarestAchievementTitle,
      rarestRarityLabel: rarestAchievementRarityLabel,
    } = resolveRetrospectiveViewMeta(retrospective, locale, isGamified, {
      tRetro,
      tCatalog,
      tRarities,
    });

    const equippedTitleLabel = resolveProfileTitleLabel(
      user.equippedTitle,
      isGamified,
      tTitles,
    );

    return {
      mode,
      theme,
      isGamified,
      user: {
        fullName: user.fullName || user.username || "HabitParty",
        username: user.username || "member",
        profilePhotoUrl: user.profilePhotoUrl,
        bio: user.bio,
        isPremium: Boolean(user.isPremium),
        isFounder: Boolean(user.isFounder),
        friendCode: user.friendCode,
        avatarFrame: activeFrameId ?? user.avatarFrame,
        avatarPreset: user.avatarPreset,
        equippedTitle: user.equippedTitle,
      },
      equippedTitleLabel,
      levelTitle: levelState.levelTitle,
      levelProgressPercent: levelState.progress.percent,
      includeFriendCode,
      stats: stats
        ? {
            highestStreak: stats.highestStreak,
            totalTasksCompleted: stats.totalTasksCompleted,
            totalFocusMinutes: stats.totalFocusMinutes,
            achievementPoints: stats.achievementPoints,
          }
        : null,
      highlights: resolvedHighlights,
      retrospective,
      archetypeTitle,
      archetypeDesc,
      bestMonthLabel,
      rarestAchievementTitle,
      rarestAchievementRarityLabel,
      labels: {
        brandName: "HabitParty",
        headerBadge:
          mode === "retrospective" && retrospective
            ? isGamified
              ? t("retroTitleGamified", { year: retrospective.year })
              : t("retroTitleEssential", { year: retrospective.year })
            : isGamified
              ? t("cardSubtitleGamified")
              : t("cardSubtitleEssential"),
        levelLabel: t("levelLabel"),
        highlightsTitle: t("highlightsTitle"),
        noHighlights: t("noHighlights"),
        friendCodeLabel: t("friendCodeLabel"),
        vipLabel: t("vipLabel"),
        founderLabel: t("founderLabel"),
        generatedBy: t("generatedBy"),
        metricStreakLabel: t("metrics.streak"),
        metricTasksLabel: t("metrics.tasks"),
        metricFocusLabel: t("metrics.focus"),
        metricPointsLabel: t("metrics.points"),
        retroActiveDaysLabel: t("metrics.activeDays"),
        retroActiveDaysSub: tRetro("metrics.activeDaysSub"),
        retroTasksLabel: t("metrics.tasks"),
        retroFocusLabel: t("metrics.focus"),
        retroXpLabel: t("metrics.xpEarned"),
        retroBestMonthLabel: t("metrics.bestMonth"),
        retroRarestLabel: t("metrics.rarestAchievement"),
        retroArchetypeLabel: tRetro("archetypeLabel"),
        retroCoinsSub: isGamified
          ? tRetro("metrics.coinsEarned", {
              coins: retrospective?.coinsEarned ?? 0,
            })
          : tRetro("metrics.creditsEarned", {
              credits: retrospective?.coinsEarned ?? 0,
            }),
        retroHardTasksSub: tRetro("metrics.hardTasks", {
          count: retrospective?.hardTasksCompleted ?? 0,
        }),
        retroFocusSessionsSub: tRetro("metrics.focusSessions", {
          sessions: retrospective?.focusSessionsCount ?? 0,
          pomodoros: retrospective?.pomodorosCompleted ?? 0,
        }),
        retroBestMonthSub: tRetro("metrics.bestMonthSub", {
          count: retrospective?.bestMonthTasksCount ?? 0,
        }),
        retroNoRarest: tRetro("noRarestYet", {
          year: retrospective?.year ?? "",
        }),
        retroNoBestMonth: tRetro("noBestMonth"),
      },
    };
  }, [
    mode,
    theme,
    isGamified,
    user,
    activeFrameId,
    levelState,
    stats,
    highlights,
    achievements,
    artifacts,
    taskStreaks,
    retrospective,
    includeFriendCode,
    locale,
    t,
    tRetro,
    tRarities,
    tCatalog,
    tBadges,
    tHighlights,
    tArtifacts,
    tTitles,
  ]);
}
