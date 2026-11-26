import { Droplets, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils";

interface DemoHabitCardProps {
  waterCount: number;
  isEssential: boolean;
  onMinus: () => void;
  onPlus: (e: React.MouseEvent) => void;
}

export function DemoHabitCard({
  waterCount,
  isEssential,
  onMinus,
  onPlus,
}: DemoHabitCardProps) {
  const t = useTranslations("landing.demo.habitCard");

  return (
    <div className="p-4 rounded-xl bg-card dark:bg-card/70 border border-neutral-700 dark:border-white/10 shadow-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-tiny font-bold text-primary-dark dark:text-primary-light uppercase tracking-wider bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded">
            {t("badge")}
          </span>
          <span
            className={cn(
              "text-xs font-bold flex items-center gap-1 tabular-nums",
              isEssential ? "text-info" : "text-gold-ink dark:text-gold",
            )}
          >
            <CoinIcon size={13} variant={isEssential ? "credit" : "coin"} /> +2
          </span>
        </div>
        <h4 className="text-sm font-bold text-neutral-50 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-info shrink-0" aria-hidden="true" />
          <span>{t("title")}</span>
        </h4>
        <p className="text-xs text-neutral-400 mt-1">
          {t("logsLabel")}
          <strong className="text-neutral-200 tabular-nums">
            {t("glassesCount", { count: waterCount })}
          </strong>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
        <span className="text-tiny text-neutral-400">{t("clickToScore")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={waterCount === 0}
            onClick={onMinus}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-hover text-neutral-200 hover:text-neutral-50 dark:bg-surface dark:hover:bg-surface-hover dark:text-neutral-300 dark:hover:text-white flex items-center justify-center border border-neutral-700 dark:border-white/10 active:scale-95 transition-[transform,background-color,color,opacity] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label={t("decreaseAria")}
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onPlus}
            className="px-3 h-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1 shadow-xs dark:shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] active:scale-95 transition-[transform,background-color] hover:scale-105 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {isEssential ? t("pointsAction") : t("xpAction")}
          </button>
        </div>
      </div>
    </div>
  );
}
