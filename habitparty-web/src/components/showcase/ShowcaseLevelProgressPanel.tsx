import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";

interface ShowcaseLevelProgressPanelProps {
  stats: ShowcaseStatsResponseDTO;
  currentXp: number;
  levelTitle: string;
  nextLevelTitle: string;
  progress: {
    percent: number;
    remainingXp: number;
    isMaxLevel: boolean;
  };
}

export function ShowcaseLevelProgressPanel({
  stats,
  currentXp,
  levelTitle,
  nextLevelTitle,
  progress,
}: ShowcaseLevelProgressPanelProps) {
  const t = useTranslations("showcase.header");

  return (
    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-72 shrink-0">
      {/* Card de Pontos de Conquista */}
      <div className="flex items-center gap-3.5 rounded-xl border border-amber-500/30 dark:border-gold/35 bg-amber-500/[0.08] dark:bg-gradient-to-br dark:from-gold/15 dark:via-amber-500/5 dark:to-transparent p-3.5">
        <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
          <Trophy size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300 block">
            {t("achievementPointsLabel")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700 dark:text-gold tabular-nums">
              {stats.achievementPoints}
            </span>
            <span className="text-tiny font-semibold text-neutral-300">
              •{" "}
              {t("unlockedCountLabel", {
                unlocked: stats.unlockedAchievementsCount,
                total: stats.totalAchievementsCount,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Card de Patente / Nível & Barra de XP */}
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/60 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-neutral-100 truncate">
            {levelTitle}
          </span>
          <span className="text-tiny font-bold text-amber-700 dark:text-gold tabular-nums shrink-0">
            {progress.percent}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-neutral-700 dark:bg-neutral-900 overflow-hidden border border-neutral-600/50 dark:border-primary/15">
          <div
            className="h-full w-full origin-left bg-gradient-to-r from-amber-500 via-gold to-yellow-300 transition-transform duration-500"
            style={{
              transform: `scaleX(${Math.min(100, Math.max(0, progress.percent)) / 100})`,
            }}
          />
        </div>

        <span className="text-tiny text-neutral-400 truncate">
          {!progress.isMaxLevel
            ? t("xpProgressLabel", {
                xp: currentXp,
                remaining: progress.remainingXp,
                nextTitle: nextLevelTitle,
              })
            : t("maxLevelReached", { xp: currentXp })}
        </span>
      </div>
    </div>
  );
}
