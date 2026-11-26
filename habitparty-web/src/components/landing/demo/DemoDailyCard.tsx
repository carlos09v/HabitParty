import { BookOpen, CheckCircle2, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils";

interface DemoDailyCardProps {
  isStudyDone: boolean;
  studyStreak: number;
  isEssential: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function DemoDailyCard({
  isStudyDone,
  studyStreak,
  isEssential,
  onToggle,
}: DemoDailyCardProps) {
  const t = useTranslations("landing.demo.dailyCard");

  return (
    <div
      className={cn(
        "p-4 rounded-xl border flex flex-col justify-between transition-colors",
        isStudyDone
          ? "bg-success-500/10 border-success-500/40"
          : "bg-card dark:bg-card/70 border-neutral-700 dark:border-white/10 shadow-none",
      )}
    >
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-tiny font-bold text-gold-ink dark:text-warning-500 uppercase tracking-wider bg-amber-500/12 dark:bg-warning-500/10 px-2 py-0.5 rounded flex items-center gap-1">
            <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
            {t("streakBadge", { count: studyStreak })}
          </span>
          <span
            className={cn(
              "text-xs font-bold flex items-center gap-1 tabular-nums",
              isEssential ? "text-info" : "text-gold-ink dark:text-gold",
            )}
          >
            <CoinIcon size={13} variant={isEssential ? "credit" : "coin"} /> +5
          </span>
        </div>
        <h4
          className={cn(
            "text-sm font-bold flex items-center gap-2",
            isStudyDone ? "line-through text-neutral-400" : "text-neutral-50",
          )}
        >
          <BookOpen
            className="w-4 h-4 text-primary dark:text-primary-light shrink-0"
            aria-hidden="true"
          />
          <span>{t("title")}</span>
        </h4>
        <p className="text-xs text-neutral-400 mt-1">{t("resetNote")}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
        <span className="text-tiny text-neutral-400">
          {isStudyDone ? t("statusDone") : t("statusPending")}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isStudyDone}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-[transform,background-color,border-color,color] active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
            isStudyDone
              ? "bg-success-500/15 text-success-400 border border-success-500/35"
              : "bg-gold hover:bg-gold-hover text-on-gold shadow-sm dark:shadow-glow-gold hover:scale-105",
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          {isStudyDone
            ? t("buttonDone")
            : isEssential
              ? t("buttonPendingEssential")
              : t("buttonPending")}
        </button>
      </div>
    </div>
  );
}
