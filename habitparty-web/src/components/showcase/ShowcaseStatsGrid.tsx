import { getFormatter, getTranslations } from "next-intl/server";
import { DEFAULT_MAX_ACHIEVEMENT_POINTS } from "@/constants/achievements";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import {
  type ShowcaseStatCardData,
  ShowcaseStatsGridView,
} from "./ShowcaseStatsGridView";

interface ShowcaseStatsGridProps {
  stats: ShowcaseStatsResponseDTO;
  isGamified?: boolean;
}

export async function ShowcaseStatsGrid({
  stats,
  isGamified = false,
}: ShowcaseStatsGridProps) {
  const [t, format] = await Promise.all([
    getTranslations("showcase.statsGrid"),
    getFormatter(),
  ]);

  const focusHours = Math.round((stats.totalFocusMinutes / 60) * 10) / 10;
  const masteryPercent =
    stats.totalAchievementsCount > 0
      ? Math.round(
          (stats.unlockedAchievementsCount / stats.totalAchievementsCount) *
            100,
        )
      : 0;

  const cards: ShowcaseStatCardData[] = [
    {
      id: "highestStreak",
      iconKey: "flame",
      iconClass:
        "bg-orange-500/15 border-orange-500/35 text-orange-600 dark:text-orange-400",
      gamifiedLabel: t("highestStreak.label"),
      essentialLabel: t("highestStreak.essentialLabel"),
      value: `${format.number(stats.highestStreak)}d`,
      sub: t("highestStreak.sub", {
        current: format.number(stats.currentStreak),
      }),
    },
    {
      id: "tasksCompleted",
      iconKey: "swords",
      essentialIconKey: "checkSquare",
      iconClass:
        "bg-sky-500/15 border-sky-500/35 text-sky-700 dark:text-sky-400",
      gamifiedLabel: t("tasksCompleted.label"),
      essentialLabel: t("tasksCompleted.essentialLabel"),
      value: format.number(stats.totalTasksCompleted),
      sub: t("tasksCompleted.sub", {
        hardcore: format.number(stats.totalHardcoreTasksCompleted),
        hard: format.number(stats.totalHardTasksCompleted),
      }),
      essentialSub: t("tasksCompleted.essentialSub", {
        hardcore: format.number(stats.totalHardcoreTasksCompleted),
        hard: format.number(stats.totalHardTasksCompleted),
      }),
    },
    {
      id: "focusTime",
      iconKey: "hourglass",
      iconClass:
        "bg-primary/15 border-primary/35 text-primary dark:text-primary-light",
      gamifiedLabel: t("focusTime.label"),
      essentialLabel: t("focusTime.essentialLabel"),
      value: `${format.number(focusHours)}h`,
      sub: t("focusTime.sub", {
        sessions: format.number(stats.totalFocusSessions),
        minutes: format.number(stats.totalFocusMinutes),
      }),
    },
    {
      id: "achievementsProgress",
      iconKey: "trophy",
      iconClass: "bg-gold/15 border-gold/40 text-amber-700 dark:text-gold",
      gamifiedLabel: t("achievementsProgress.label"),
      essentialLabel: t("achievementsProgress.essentialLabel"),
      value: `${stats.unlockedAchievementsCount}/${stats.totalAchievementsCount} (${masteryPercent}%)`,
      sub: t("achievementsProgress.sub", {
        points: format.number(stats.achievementPoints),
        maxPoints: format.number(
          stats.maxAchievementPoints || DEFAULT_MAX_ACHIEVEMENT_POINTS,
        ),
      }),
    },
  ];

  return (
    <ShowcaseStatsGridView
      sectionTitleGamified={t("sectionTitleGamified")}
      sectionTitleEssential={t("sectionTitleEssential")}
      cards={cards}
      initialIsGamified={isGamified}
    />
  );
}
