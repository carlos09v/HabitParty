import { Flame, Hourglass, Swords, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DEFAULT_MAX_ACHIEVEMENT_POINTS } from "@/constants/achievements";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import { cn } from "@/utils";

interface ShowcaseStatsGridProps {
  stats: ShowcaseStatsResponseDTO;
  isGamified?: boolean;
  isCompact?: boolean;
}

export async function ShowcaseStatsGrid({
  stats,
  isGamified = true,
  isCompact = false,
}: ShowcaseStatsGridProps) {
  const t = await getTranslations("showcase.statsGrid");

  const focusHours = Math.round((stats.totalFocusMinutes / 60) * 10) / 10;
  const masteryPercent =
    stats.totalAchievementsCount > 0
      ? Math.round(
          (stats.unlockedAchievementsCount / stats.totalAchievementsCount) *
            100,
        )
      : 0;

  const cards = [
    {
      id: "highestStreak",
      icon: <Flame size={20} />,
      iconClass:
        "bg-orange-500/15 border-orange-500/35 text-orange-600 dark:text-orange-400",
      label: isGamified
        ? t("highestStreak.label")
        : t("highestStreak.essentialLabel"),
      value: `${stats.highestStreak}d`,
      sub: t("highestStreak.sub", { current: stats.currentStreak }),
    },
    {
      id: "tasksCompleted",
      icon: <Swords size={20} />,
      iconClass:
        "bg-sky-500/15 border-sky-500/35 text-sky-700 dark:text-sky-400",
      label: isGamified
        ? t("tasksCompleted.label")
        : t("tasksCompleted.essentialLabel"),
      value: String(stats.totalTasksCompleted),
      sub: t("tasksCompleted.sub", {
        hardcore: stats.totalHardcoreTasksCompleted,
        hard: stats.totalHardTasksCompleted,
      }),
    },
    {
      id: "focusTime",
      icon: <Hourglass size={20} />,
      iconClass:
        "bg-purple-500/15 border-purple-500/35 text-purple-700 dark:text-purple-300",
      label: isGamified ? t("focusTime.label") : t("focusTime.essentialLabel"),
      value: `${focusHours}h`,
      sub: t("focusTime.sub", {
        sessions: stats.totalFocusSessions,
        minutes: stats.totalFocusMinutes,
      }),
    },
    {
      id: "achievementsProgress",
      icon: <Trophy size={20} />,
      iconClass: "bg-gold/15 border-gold/40 text-amber-700 dark:text-gold",
      label: isGamified
        ? t("achievementsProgress.label")
        : t("achievementsProgress.essentialLabel"),
      value: `${stats.unlockedAchievementsCount}/${stats.totalAchievementsCount} (${masteryPercent}%)`,
      sub: t("achievementsProgress.sub", {
        points: stats.achievementPoints,
        maxPoints: stats.maxAchievementPoints || DEFAULT_MAX_ACHIEVEMENT_POINTS,
      }),
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body-m font-extrabold text-neutral-100">
        {isGamified ? t("sectionTitleGamified") : t("sectionTitleEssential")}
      </h2>

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          isCompact ? "gap-3" : "gap-4",
        )}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={cn(
              "rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex items-start gap-3.5 transition-colors hover:border-primary/40",
              isCompact ? "p-3.5" : "p-4",
            )}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                card.iconClass,
              )}
            >
              {card.icon}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-tiny font-bold uppercase tracking-wider text-neutral-400 block truncate">
                {card.label}
              </span>
              <span className="text-lg font-black text-neutral-50 tabular-nums block mt-0.5">
                {card.value}
              </span>
              <span className="text-tiny text-neutral-400 block truncate mt-0.5">
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
