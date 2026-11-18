import { ChevronRight, Trophy } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
  onOpenProgression?: () => void;
}

export function ShowcaseLevelProgressPanel({
  stats,
  currentXp,
  levelTitle,
  nextLevelTitle,
  progress,
  onOpenProgression,
}: ShowcaseLevelProgressPanelProps) {
  const t = useTranslations("showcase.header");
  const format = useFormatter();

  const formattedCurrentXp = format.number(currentXp);
  const formattedRemainingXp = format.number(progress.remainingXp);
  const formattedAchievementPoints = format.number(stats.achievementPoints);

  const rankCardContent = (
    <>
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-xs font-extrabold text-neutral-100 truncate">
          {levelTitle}
        </span>
        <span className="text-tiny font-bold text-amber-700 dark:text-gold tabular-nums shrink-0">
          {progress.percent}%
        </span>
      </div>

      <ProgressBar
        as="span"
        decorative={Boolean(onOpenProgression)}
        percent={progress.percent}
        className="h-2 bg-neutral-700 dark:bg-neutral-900 border border-neutral-600/50 dark:border-primary/15"
        fillClassName="bg-gradient-to-r from-amber-500 via-gold to-yellow-300 transition-transform duration-500"
        ariaLabel={levelTitle}
      />

      <span className="text-tiny text-neutral-400 truncate w-full text-left">
        {!progress.isMaxLevel
          ? t("xpProgressLabel", {
              xp: formattedCurrentXp,
              remaining: formattedRemainingXp,
              nextTitle: nextLevelTitle,
            })
          : t("maxLevelReached", { xp: formattedCurrentXp })}
      </span>

      {onOpenProgression && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-gold mt-0.5">
          <span>{t("openProgressionHint")}</span>
          <ChevronRight size={13} aria-hidden="true" />
        </span>
      )}
    </>
  );

  return (
    <div className="grid grid-cols-1 @lg:grid-cols-2 @4xl:grid-cols-1 gap-3 w-full @4xl:w-72 shrink-0">
      {/* Card de Pontos de Conquista */}
      <div className="flex items-center gap-3.5 rounded-xl border border-amber-500/30 dark:border-gold/35 bg-amber-500/[0.08] dark:bg-gradient-to-br dark:from-gold/15 dark:via-amber-500/5 dark:to-transparent p-3.5">
        <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
          <Trophy size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300 block">
            {t("achievementPointsLabel")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-700 dark:text-gold tabular-nums">
              {formattedAchievementPoints}
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
      {onOpenProgression ? (
        <button
          type="button"
          onClick={onOpenProgression}
          className="flex flex-col gap-2 rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/60 hover:border-amber-500/50 dark:hover:border-gold/50 hover:bg-surface/90 p-3.5 text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {rankCardContent}
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/60 p-3.5">
          {rankCardContent}
        </div>
      )}
    </div>
  );
}
