"use client";

import { Calendar, Repeat, SlidersHorizontal, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { QuickAddConfigBar } from "@/components/tasks/task-form/QuickAddConfigBar";
import { ALL_WEEK_DAYS, WEEKDAYS_ONLY } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import type {
  CreateTaskDTO,
  HabitImportanceOption,
  HabitTypeOption,
  TaskDifficultyOption,
  TaskTypeOption,
} from "@/types/task";
import type {
  InitialTaskFormData,
  RoutineQuickAddFormProps,
} from "@/types/task-ui";
import { cn } from "@/utils";
import { getOffsetDateString, getTodayDateString } from "@/utils/date";

export function RoutineQuickAddForm({
  columnId,
  isCompact = false,
  isColumnCompact = false,
  onClose,
  onQuickCreateTask,
  onOpenDetailedForm,
}: RoutineQuickAddFormProps) {
  const t = useTranslations("tasks.quickAdd");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCompactMode = isColumnCompact || isCompact;

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskTypeOption>("TODO");
  const [habitType, setHabitType] = useState<HabitTypeOption>("POSITIVE");
  const [importanceType, setImportanceType] =
    useState<HabitImportanceOption>("NORMAL");
  const [resetCounter, setResetCounter] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [dailyFreq, setDailyFreq] = useState<"DAILY" | "WEEKDAYS">("DAILY");
  const [difficulty, setDifficulty] = useState<TaskDifficultyOption>("MEDIUM");
  const [dueOffset, setDueOffset] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useClickOutside(containerRef, onClose, { onEscape: onClose });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let extraPayload: Partial<CreateTaskDTO> | undefined;
      if (taskType === "HABIT") {
        extraPayload = {
          habitType,
          resetCounter,
          importanceType,
          difficulty: "EASY",
        };
      } else if (taskType === "DAILY") {
        extraPayload = {
          startDate: getTodayDateString(),
          repeatType: dailyFreq === "WEEKDAYS" ? "WEEKLY" : "DAILY",
          repeatEvery: 1,
          daysOfWeek:
            dailyFreq === "WEEKDAYS" ? [...WEEKDAYS_ONLY] : ALL_WEEK_DAYS,
          difficulty,
        };
      } else {
        extraPayload = {
          difficulty,
          ...(dueOffset !== null && {
            dueDate: getOffsetDateString(dueOffset),
          }),
        };
      }

      await onQuickCreateTask?.(trimmedTitle, columnId, taskType, extraPayload);
      setTitle("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2 p-2.5 rounded-xl border border-gold/70 bg-primary-dark/40 shadow-glow-gold-xs animate-in fade-in zoom-in-95 duration-150 shrink-0",
        isCompactMode && "p-2 gap-1.5",
      )}
    >
      {/* Seletor Compacto dos 3 Tipos: A Fazer (padrão), Hábito, Diária */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface/80 border border-white/10 w-full">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setTaskType("TODO");
            inputRef.current?.focus();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-md font-bold transition-all cursor-pointer",
            isColumnCompact ? "text-tiny" : "text-label-g",
            taskType === "TODO"
              ? "bg-gold text-on-gold shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title={t("todoTitle")}
        >
          <Target size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">
            {isColumnCompact ? t("todoCompact") : t("todoNormal")}
          </span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setTaskType("HABIT");
            inputRef.current?.focus();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-md font-bold transition-all cursor-pointer",
            isColumnCompact ? "text-tiny" : "text-label-g",
            taskType === "HABIT"
              ? "bg-gold text-on-gold shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title={t("habitTitle")}
        >
          <Repeat size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">{t("habitLabel")}</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setTaskType("DAILY");
            inputRef.current?.focus();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-md font-bold transition-all cursor-pointer",
            isColumnCompact ? "text-tiny" : "text-label-g",
            taskType === "DAILY"
              ? "bg-gold text-on-gold shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title={t("dailyTitle")}
        >
          <Calendar size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">{t("dailyLabel")}</span>
        </button>
      </div>

      {/* Input de Título com Placeholder Contextual */}
      <input
        ref={inputRef}
        type="text"
        placeholder={
          taskType === "HABIT"
            ? t("habitPlaceholder")
            : taskType === "DAILY"
              ? t("dailyPlaceholder")
              : t("todoPlaceholder")
        }
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await handleSubmit();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        disabled={isSubmitting}
        className="w-full bg-transparent text-neutral-100 placeholder:text-neutral-500 text-xs sm:text-sm font-medium outline-none px-1"
      />

      <QuickAddConfigBar
        taskType={taskType}
        dueOffset={dueOffset}
        onDueOffsetChange={setDueOffset}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        habitType={habitType}
        onHabitTypeChange={setHabitType}
        importanceType={importanceType}
        onImportanceChange={setImportanceType}
        resetCounter={resetCounter}
        onToggleResetCounter={() =>
          setResetCounter((prev) => (prev === "DAILY" ? "WEEKLY" : "DAILY"))
        }
        dailyFreq={dailyFreq}
        onDailyFreqChange={setDailyFreq}
        onFocusInput={() => inputRef.current?.focus()}
      />

      {/* Rodapé com Ações */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="px-2.5 py-1 rounded-md bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? t("creating") : t("createButton")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-md text-neutral-400 hover:text-neutral-200 text-xs cursor-pointer transition-colors"
          >
            {t("cancelButton")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            const trimmedTitle = title.trim();
            const initialValues: InitialTaskFormData = {
              title: trimmedTitle,
              taskType,
              ...(taskType === "TODO" && {
                difficulty,
                dueDate:
                  dueOffset !== null
                    ? getOffsetDateString(dueOffset)
                    : undefined,
              }),
              ...(taskType === "HABIT" && {
                habitType,
                importanceType,
                resetCounter,
              }),
              ...(taskType === "DAILY" && {
                difficulty,
                repeatType: dailyFreq === "WEEKDAYS" ? "WEEKLY" : "DAILY",
                daysOfWeek:
                  dailyFreq === "WEEKDAYS" ? [...WEEKDAYS_ONLY] : ALL_WEEK_DAYS,
                startDate: getTodayDateString(),
                repeatEvery: 1,
              }),
            };
            onOpenDetailedForm?.(
              columnId,
              taskType,
              trimmedTitle,
              initialValues,
            );
          }}
          title={t("moreOptionsTitle")}
          className="text-neutral-400 hover:text-gold flex items-center gap-1 transition-colors cursor-pointer shrink-0 rounded p-1 hover:bg-white/5"
        >
          <SlidersHorizontal size={13} />
          <span
            className={cn(isColumnCompact ? "hidden" : "inline text-label-g")}
          >
            {t("moreOptionsButton")}
          </span>
        </button>
      </div>
    </div>
  );
}
