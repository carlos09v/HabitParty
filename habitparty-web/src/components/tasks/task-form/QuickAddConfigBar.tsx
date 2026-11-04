import { CalendarClock, Sword, Swords } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DIFFICULTY_DOT_COLORS,
  DIFFICULTY_SWORD_COLORS,
  HABIT_IMPORTANCE_OPTIONS,
  TASK_DIFFICULTY_OPTIONS,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type {
  HabitImportanceOption,
  HabitTypeOption,
  TaskDifficultyOption,
  TaskTypeOption,
} from "@/types/task";
import { cn } from "@/utils";
import { HABIT_IMPORTANCE_META } from "./HabitImportanceSelector";

interface QuickAddConfigBarProps {
  taskType: TaskTypeOption;
  dueOffset: number | null;
  onDueOffsetChange: (offset: number | null) => void;
  difficulty: TaskDifficultyOption;
  onDifficultyChange: (difficulty: TaskDifficultyOption) => void;
  habitType: HabitTypeOption;
  onHabitTypeChange: (habitType: HabitTypeOption) => void;
  importanceType: HabitImportanceOption;
  onImportanceChange: (importance: HabitImportanceOption) => void;
  resetCounter: "DAILY" | "WEEKLY";
  onToggleResetCounter: () => void;
  dailyFreq: "DAILY" | "WEEKDAYS";
  onDailyFreqChange: (freq: "DAILY" | "WEEKDAYS") => void;
  onFocusInput?: () => void;
}

export function QuickAddConfigBar({
  taskType,
  dueOffset,
  onDueOffsetChange,
  difficulty,
  onDifficultyChange,
  habitType,
  onHabitTypeChange,
  importanceType,
  onImportanceChange,
  resetCounter,
  onToggleResetCounter,
  dailyFreq,
  onDailyFreqChange,
  onFocusInput,
}: QuickAddConfigBarProps) {
  const t = useTranslations("tasks.quickAdd");
  const tOptions = useTranslations("tasks.options");
  const { isGamified } = useExperienceMode();

  const renderDifficultyRow = () => (
    <div className="flex items-center justify-between gap-1 border-t border-white/5 pt-1 flex-wrap">
      <span className="text-neutral-400 font-medium text-tiny shrink-0">
        {t("effortLabel")}
      </span>
      <div className="flex items-center gap-1">
        {TASK_DIFFICULTY_OPTIONS.map((opt) => {
          const isSelected = difficulty === opt.id;
          const DifficultyIcon =
            opt.id === "MEDIUM" || opt.id === "HARD" ? Swords : Sword;
          return (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onDifficultyChange(opt.id);
                onFocusInput?.();
              }}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                isSelected
                  ? "bg-white/15 text-neutral-100 border border-white/25"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {isGamified ? (
                <DifficultyIcon
                  size={10}
                  className={cn("shrink-0", DIFFICULTY_SWORD_COLORS[opt.id])}
                />
              ) : (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    DIFFICULTY_DOT_COLORS[opt.id],
                  )}
                />
              )}
              <span>{tOptions(`difficulties.${opt.id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (taskType === "TODO") {
    return (
      <div className="flex flex-col gap-1.5 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="text-neutral-400 font-medium text-tiny flex items-center gap-1 shrink-0">
            <CalendarClock size={11} className="text-gold" />
            {t("dueLabel")}
          </span>
          <div className="flex items-center gap-1">
            {[
              { label: t("dueNoDate"), offset: null },
              { label: t("dueToday"), offset: 0 },
              { label: t("dueTomorrow"), offset: 1 },
              { label: t("due7Days"), offset: 7 },
            ].map((opt) => {
              const isSelected = dueOffset === opt.offset;
              return (
                <button
                  key={String(opt.offset)}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onDueOffsetChange(opt.offset);
                    onFocusInput?.();
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                    isSelected
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "text-neutral-400 hover:text-neutral-200",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderDifficultyRow()}
      </div>
    );
  }

  if (taskType === "HABIT") {
    return (
      <div className="flex flex-col gap-1.5 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="text-neutral-400 font-medium text-tiny shrink-0">
            {t("directionLabel")}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onHabitTypeChange("POSITIVE");
                onFocusInput?.();
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                habitType === "POSITIVE"
                  ? "bg-success-500/20 text-success-500 border border-success-500/40"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title={t("positiveTitle")}
            >
              {t("positiveLabel")}
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onHabitTypeChange("NEGATIVE");
                onFocusInput?.();
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                habitType === "NEGATIVE"
                  ? "bg-danger-500/20 text-danger-500 border border-danger-500/40"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title={t("negativeTitle")}
            >
              {t("negativeLabel")}
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onHabitTypeChange("BOTH");
                onFocusInput?.();
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                habitType === "BOTH"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title={t("bothTitle")}
            >
              {t("bothLabel")}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-white/5 pt-1 flex-wrap">
          <span className="text-neutral-400 font-medium text-tiny shrink-0">
            {t("importanceLabel")}
          </span>
          <div className="flex items-center gap-1">
            {HABIT_IMPORTANCE_OPTIONS.map((imp) => {
              const isSelected = importanceType === imp.id;
              return (
                <button
                  key={imp.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onImportanceChange(imp.id);
                    onFocusInput?.();
                  }}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
                    isSelected
                      ? "bg-white/15 text-neutral-100 border border-white/25"
                      : "text-neutral-400 hover:text-neutral-200",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      HABIT_IMPORTANCE_META[imp.id].dotColor,
                    )}
                  />
                  <span>{tOptions(`importances.${imp.id}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-1">
          <span className="text-neutral-400 font-medium text-tiny shrink-0">
            {t("resetLabel")}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onToggleResetCounter();
              onFocusInput?.();
            }}
            className="text-tiny text-neutral-300 hover:text-gold transition-colors font-medium cursor-pointer px-1 py-0.5 rounded hover:bg-white/5"
            title={t("toggleResetTitle")}
          >
            {resetCounter === "DAILY" ? t("resetDaily") : t("resetWeekly")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-neutral-400 font-medium text-tiny shrink-0">
          {t("frequencyLabel")}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onDailyFreqChange("DAILY");
              onFocusInput?.();
            }}
            className={cn(
              "px-2 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
              dailyFreq === "DAILY"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("everyDay")}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onDailyFreqChange("WEEKDAYS");
              onFocusInput?.();
            }}
            className={cn(
              "px-2 py-0.5 rounded text-tiny font-bold transition-colors cursor-pointer",
              dailyFreq === "WEEKDAYS"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("weekdays")}
          </button>
        </div>
      </div>

      {renderDifficultyRow()}
    </div>
  );
}
