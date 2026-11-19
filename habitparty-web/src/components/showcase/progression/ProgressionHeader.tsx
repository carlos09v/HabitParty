import { Mountain } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressionSummaryCards } from "./ProgressionSummaryCards";
import { XpSourcesGuideTooltip } from "./XpSourcesGuideTooltip";

interface ProgressionHeaderProps {
  isGamified: boolean;
  currentRankTitle: string;
  currentRankOrder: number;
  currentXp: number;
  nextRankTitle: string;
  isMaxLevel: boolean;
  remainingXp: number;
}

export function ProgressionHeader({
  isGamified,
  currentRankTitle,
  currentRankOrder,
  currentXp,
  nextRankTitle,
  isMaxLevel,
  remainingXp,
}: ProgressionHeaderProps) {
  const t = useTranslations("showcase.progression");

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/60 p-5 sm:p-6 shadow-card-deep dark:shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/40 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
              <Mountain size={18} aria-hidden="true" />
            </div>
            <h2 className="text-title-m font-black text-neutral-100">
              {t(isGamified ? "titleGamified" : "titleEssential")}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
            {t(isGamified ? "subtitleGamified" : "subtitleEssential")}
          </p>
        </div>

        <XpSourcesGuideTooltip isGamified={isGamified} />
      </div>

      <ProgressionSummaryCards
        isGamified={isGamified}
        currentRankTitle={currentRankTitle}
        currentRankOrder={currentRankOrder}
        currentXp={currentXp}
        nextRankTitle={nextRankTitle}
        isMaxLevel={isMaxLevel}
        remainingXp={remainingXp}
      />
    </section>
  );
}
