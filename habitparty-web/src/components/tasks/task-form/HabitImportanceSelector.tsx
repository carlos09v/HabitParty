import { Gauge } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  HABIT_IMPORTANCE_OPTIONS,
  HABIT_IMPORTANCE_REWARDS,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { HabitImportanceOption } from "@/types/task";
import { cn } from "@/utils";
import { formatCoins } from "@/utils/economy";

export const HABIT_IMPORTANCE_META: Record<
  HabitImportanceOption,
  { color: string; dotColor: string }
> = {
  LOW: {
    color: "text-info",
    dotColor: "bg-info",
  },
  NORMAL: {
    color: "text-success-500",
    dotColor: "bg-success-500",
  },
  HIGH: {
    color: "text-purple-400",
    dotColor: "bg-purple-400",
  },
};

interface HabitImportanceSelectorProps {
  value: HabitImportanceOption;
  onChange: (value: HabitImportanceOption) => void;
  disabled?: boolean;
}

export function HabitImportanceSelector({
  value,
  onChange,
  disabled = false,
}: HabitImportanceSelectorProps) {
  const t = useTranslations("tasks.taskModal.basicFields");
  const tOptions = useTranslations("tasks.options");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-s text-neutral-100 font-medium">
          {t("importanceLabel")}
        </span>
        <InfoTooltip
          title={t("importanceTooltipTitle")}
          icon={<Gauge size={14} className="text-gold shrink-0" />}
          triggerLabel={t("stillInDoubt")}
          align="right"
          ariaLabel={
            isGamified
              ? t("importanceTooltipAria")
              : t("importanceTooltipAriaProductivity")
          }
        >
          <p className="text-neutral-300 leading-relaxed text-label-g">
            {isGamified
              ? t("importanceTooltipIntro")
              : t("importanceTooltipIntroProductivity")}
          </p>

          <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
            {HABIT_IMPORTANCE_OPTIONS.map((imp) => {
              const meta = HABIT_IMPORTANCE_META[imp.id];
              const reward = HABIT_IMPORTANCE_REWARDS[imp.id];
              const coinsFormatted = formatCoins(reward.gold, { locale });
              return (
                <li key={imp.id} className="flex items-start gap-1.5">
                  <span
                    className={cn(
                      "font-bold shrink-0 flex items-center gap-1.5",
                      meta.color,
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        meta.dotColor,
                      )}
                    />
                    {tOptions(`importances.${imp.id}`)}:
                  </span>
                  <span className="text-neutral-300">
                    {isGamified && (
                      <>
                        <strong className="text-neutral-100">
                          +{reward.xp} XP • +{coinsFormatted} 🪙
                        </strong>{" "}
                        —{" "}
                      </>
                    )}
                    {t(`importanceDescriptions.${imp.id}`)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
            <strong className="text-gold block mb-0.5">
              {t("importanceRuleTitle")}
            </strong>
            {t.rich("importanceRuleBody", {
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </div>
        </InfoTooltip>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {HABIT_IMPORTANCE_OPTIONS.map((imp) => {
          const meta = HABIT_IMPORTANCE_META[imp.id];
          return (
            <button
              key={imp.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(imp.id)}
              className={cn(
                "py-1.5 px-2 rounded-lg border text-body-s font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5",
                value === imp.id
                  ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                  : "border-primary/30 bg-surface/60 text-neutral-300 hover:text-gold hover:border-gold/40",
              )}
            >
              <span
                className={cn("w-2 h-2 rounded-full shrink-0", meta.dotColor)}
              />
              <span>{tOptions(`importances.${imp.id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
