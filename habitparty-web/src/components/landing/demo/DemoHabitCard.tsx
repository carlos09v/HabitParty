import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";

interface DemoHabitCardProps {
  waterCount: number;
  onMinus: () => void;
  onPlus: (e: React.MouseEvent) => void;
}

export function DemoHabitCard({
  waterCount,
  onMinus,
  onPlus,
}: DemoHabitCardProps) {
  const t = useTranslations("landing.demo.habitCard");

  return (
    <div className="p-4 rounded-xl bg-card dark:bg-card/70 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-sm flex flex-col justify-between hover:border-primary-light/40 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-tiny font-bold text-primary-dark dark:text-primary-light uppercase tracking-wider bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded">
            {t("badge")}
          </span>
          <span className="text-xs font-bold text-amber-700 dark:text-gold flex items-center gap-1">
            <CoinIcon size={13} variant="coin" /> +5
          </span>
        </div>
        <h4 className="text-sm font-bold text-neutral-50 flex items-center gap-2">
          {t("title")}
        </h4>
        <p className="text-xs text-neutral-400 mt-1">
          {t("logsLabel")}
          <strong className="text-neutral-200">
            {t("glassesCount", { count: waterCount })}
          </strong>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between">
        <span className="text-tiny text-neutral-400">{t("clickToScore")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinus}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-hover text-neutral-200 hover:text-neutral-50 dark:bg-surface dark:hover:bg-surface-hover dark:text-neutral-300 dark:hover:text-white flex items-center justify-center border border-neutral-700 dark:border-white/10 active:scale-95 transition-[transform,background-color,color] cursor-pointer"
            aria-label={t("decreaseAria")}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPlus}
            className="px-3 h-8 rounded-lg bg-primary hover:bg-primary-light text-white font-bold text-xs flex items-center gap-1 shadow-xs dark:shadow-[0_0_12px_rgba(124,58,237,0.4)] active:scale-95 transition-[transform,background-color] hover:scale-105 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            +15 XP
          </button>
        </div>
      </div>
    </div>
  );
}
