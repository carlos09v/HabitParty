"use client";

import { ArrowLeftRight, Minus, Plus, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Select } from "@/components/ui/Select";
import { HABIT_RESET_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { ResetCounterOption } from "@/types/task";
import { cn } from "@/utils";

interface HabitFieldsProps {
  form: CreateTaskFormReturn;
}

export function HabitFields({ form }: HabitFieldsProps) {
  const t = useTranslations("tasks.taskModal.habitFields");
  const tOptions = useTranslations("tasks.options");
  const { habitType, setHabitType, resetCounter, setResetCounter, isPending } =
    form;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Tipo de Hábito (Positivo / Negativo / Ambos) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-body-s text-neutral-100 font-medium">
              {t("directionLabel")}
            </span>
            <InfoTooltip
              title={t("directionTooltipTitle")}
              icon={<ArrowLeftRight size={14} className="text-gold shrink-0" />}
              ariaLabel={t("directionTooltipAria")}
              size={14}
            >
              <p className="text-neutral-300 leading-relaxed text-label-g">
                {t("directionTooltipIntro")}
              </p>

              <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                <li className="flex items-start gap-1.5">
                  <span className="text-success-500 font-bold shrink-0">
                    {t("positiveBulletLabel")}
                  </span>
                  <span className="text-neutral-300">
                    {t.rich("positiveBulletDesc", {
                      bold: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-danger-500 font-bold shrink-0">
                    {t("negativeBulletLabel")}
                  </span>
                  <span className="text-neutral-300">
                    {t.rich("negativeBulletDesc", {
                      bold: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold shrink-0">
                    {t("bothBulletLabel")}
                  </span>
                  <span className="text-neutral-300">
                    {t("bothBulletDesc")}
                  </span>
                </li>
              </ul>
            </InfoTooltip>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("POSITIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-colors cursor-pointer disabled:opacity-50",
              habitType === "POSITIVE"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:border-gold dark:bg-gold/20 dark:text-gold dark:shadow-glow-gold-xs"
                : "border-neutral-600 bg-card text-neutral-200 hover:border-neutral-500 hover:bg-surface dark:border-primary/30 dark:bg-primary-dark/20 dark:text-neutral-300 dark:hover:text-gold dark:hover:border-gold/40",
            )}
          >
            <Plus size={16} />
            <span>{t("positiveOption")}</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("NEGATIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-colors cursor-pointer disabled:opacity-50",
              habitType === "NEGATIVE"
                ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:border-gold dark:bg-gold/20 dark:text-gold dark:shadow-glow-gold-xs"
                : "border-neutral-600 bg-card text-neutral-200 hover:border-neutral-500 hover:bg-surface dark:border-primary/30 dark:bg-primary-dark/20 dark:text-neutral-300 dark:hover:text-gold dark:hover:border-gold/40",
            )}
          >
            <Minus size={16} />
            <span>{t("negativeOption")}</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("BOTH")}
            className={cn(
              "flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-body-s font-bold transition-colors cursor-pointer disabled:opacity-50",
              habitType === "BOTH"
                ? "bg-purple-500/10 border-purple-500/40 text-purple-700 dark:border-gold dark:bg-gold/20 dark:text-gold dark:shadow-glow-gold-xs"
                : "border-neutral-600 bg-card text-neutral-200 hover:border-neutral-500 hover:bg-surface dark:border-primary/30 dark:bg-primary-dark/20 dark:text-neutral-300 dark:hover:text-gold dark:hover:border-gold/40",
            )}
          >
            <span>{t("bothOption")}</span>
          </button>
        </div>
      </div>

      {/* Contador / Reset com Popover Informativo */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-neutral-100">
            {t("resetLabel")}
          </span>

          <InfoTooltip
            title={t("resetTooltipTitle")}
            icon={<RotateCcw size={14} className="text-gold" />}
            ariaLabel={t("resetTooltipAria")}
            size={14}
          >
            <p className="text-neutral-300 leading-relaxed text-label-g">
              {t("resetTooltipIntro")}
            </p>

            <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">
                  {t("resetDailyLabel")}
                </span>
                <span className="text-neutral-300">{t("resetDailyDesc")}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">
                  {t("resetWeeklyLabel")}
                </span>
                <span className="text-neutral-300">{t("resetWeeklyDesc")}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gold font-bold shrink-0">
                  {t("resetMonthlyLabel")}
                </span>
                <span className="text-neutral-300">
                  {t("resetMonthlyDesc")}
                </span>
              </li>
            </ul>

            <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
              {t.rich("resetStreakNote", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </InfoTooltip>
        </div>

        <Select
          options={HABIT_RESET_OPTIONS.map((opt) => ({
            value: opt.id,
            label: tOptions(`resets.${opt.id}`),
          }))}
          value={resetCounter}
          onChange={(val) => setResetCounter(val as ResetCounterOption)}
          disabled={isPending}
          compact
        />
      </div>
    </div>
  );
}
