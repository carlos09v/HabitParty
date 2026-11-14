"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
  AchievementRarity,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import {
  resolveHighlightSlotCard,
  resolveRetrospectiveAchievementTitle,
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
  fullName?: string | null;
  username?: string | null;
  profilePhotoUrl?: string | null;
  bio?: string | null;
  isPremium?: boolean | null;
  isFounder?: boolean | null;
  avatarFrame?: string | null;
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
          isGamified,
          levelTitle: levelState.levelTitle,
          currentXp: levelState.currentXp,
          tCatalog,
          tBadges,
        });
        if (!card) return null;
        return {
          title: card.title,
          badge: `${tHighlights(`typeBadge.${item.highlightType}`)} • ${tRarities(card.rarity)}`,
          accentHex: RARITY_HEX[card.rarity] || "#38BDF8",
        };
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);

    const bestMonthLabel =
      retrospective?.bestMonth &&
      retrospective.bestMonth >= 1 &&
      retrospective.bestMonth <= 12
        ? new Intl.DateTimeFormat(locale, {
            month: "long",
            timeZone: "UTC",
          }).format(new Date(Date.UTC(2024, retrospective.bestMonth - 1, 1)))
        : null;

    const archetypeKey = retrospective?.archetype ?? "RISING_SPARK";
    const archetypeTitle = isGamified
      ? tRetro(`archetypes.${archetypeKey}.title`)
      : tRetro(`archetypes.${archetypeKey}.essentialTitle`);
    const archetypeDesc = tRetro(`archetypes.${archetypeKey}.desc`);

    const rarestAchievementTitle = resolveRetrospectiveAchievementTitle(
      retrospective,
      isGamified,
      tCatalog,
    );

    const rawRarity = retrospective?.rarestAchievementRarity;
    const rarestAchievementRarityLabel =
      rawRarity && tRarities.has(rawRarity as AchievementRarity)
        ? tRarities(rawRarity as AchievementRarity)
        : (rawRarity ?? null);

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
      },
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
    retrospective,
    includeFriendCode,
    locale,
    t,
    tRetro,
    tRarities,
    tCatalog,
    tBadges,
    tHighlights,
  ]);
}
