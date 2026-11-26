"use client";

import { Calendar, Repeat, SlidersHorizontal, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { QuickAddConfigBar } from "@/components/tasks/task-form/QuickAddConfigBar";
import {
  ALL_WEEK_DAYS,
  TASK_TITLE_MAX_LENGTH,
  WEEKDAYS_ONLY,
} from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useUserStore } from "@/store/userStore";
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

const QUICK_ADD_TYPE_OPTIONS = [
  { id: "TODO" as const, icon: Target, titleKey: "todoTitle" as const },
  { id: "HABIT" as const, icon: Repeat, titleKey: "habitTitle" as const },
  { id: "DAILY" as const, icon: Calendar, titleKey: "dailyTitle" as const },
];

export function RoutineQuickAddForm({
  columnId,
  isColumnCompact = false,
  onClose,
  onQuickCreateTask,
  onOpenDetailedForm,
}: RoutineQuickAddFormProps) {
  const t = useTranslations("tasks.quickAdd");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskTypeOption>("TODO");
  const [habitType, setHabitType] = useState<HabitTypeOption>("POSITIVE");
  const [importanceType, setImportanceType] =
    useState<HabitImportanceOption>("NORMAL");
  const [resetCounter, setResetCounter] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [dailyFreq, setDailyFreq] = useState<"DAILY" | "WEEKDAYS">("DAILY");
  const [difficulty, setDifficulty] = useState<TaskDifficultyOption>("MEDIUM");
  const [dueOffset, setDueOffset] = useState<number | null>(null);
  const [dueTime, setDueTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDueOffsetChange = (nextOffset: number | null) => {
    setDueOffset(nextOffset);
    if (nextOffset === null) {
      setDueTime("");
    }
  };

  const handleDueTimeChange = (nextTime: string) => {
    const cleanTime = nextTime ? nextTime.slice(0, 5) : "";
    setDueTime(cleanTime);
    if (cleanTime && dueOffset === null) {
      setDueOffset(0);
    }
  };

  useClickOutside(containerRef, onClose, { onEscape: onClose });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Constrói os campos derivados do tipo selecionado em uma única fonte de verdade,
   * usada tanto na criação rápida inline quanto na transição para o modal detalhado.
   */
  const buildQuickAddFields = (
    trimmedTitle: string,
  ): {
    extraPayload: Partial<CreateTaskDTO>;
    initialValues: InitialTaskFormData;
  } => {
    const timeZone = useUserStore.getState().user?.timezone;
    const now = new Date();

    if (taskType === "HABIT") {
      return {
        extraPayload: {
          habitType,
          resetCounter,
          importanceType,
          difficulty: "EASY",
        },
        initialValues: {
          title: trimmedTitle,
          taskType,
          habitType,
          importanceType,
          resetCounter,
        },
      };
    }

    if (taskType === "DAILY") {
      const startDate = getTodayDateString(now, timeZone);
      const repeatType = dailyFreq === "WEEKDAYS" ? "WEEKLY" : "DAILY";
      const daysOfWeek =
        dailyFreq === "WEEKDAYS" ? [...WEEKDAYS_ONLY] : ALL_WEEK_DAYS;
      return {
        extraPayload: {
          startDate,
          repeatType,
          repeatEvery: 1,
          daysOfWeek,
          difficulty,
        },
        initialValues: {
          title: trimmedTitle,
          taskType,
          difficulty,
          repeatType,
          daysOfWeek,
          startDate,
          repeatEvery: 1,
        },
      };
    }

    const resolvedOffset = dueOffset !== null ? dueOffset : dueTime ? 0 : null;
    const resolvedDueDate =
      resolvedOffset !== null
        ? getOffsetDateString(resolvedOffset, now, timeZone)
        : undefined;

    return {
      extraPayload: {
        difficulty,
        ...(resolvedDueDate && { dueDate: resolvedDueDate }),
        ...(dueTime && { dueTime }),
      },
      initialValues: {
        title: trimmedTitle,
        taskType,
        difficulty,
        dueDate: resolvedDueDate,
        dueTime: dueTime || undefined,
      },
    };
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { extraPayload } = buildQuickAddFields(trimmedTitle);
      const created = await onQuickCreateTask?.(
        trimmedTitle,
        columnId,
        taskType,
        extraPayload,
      );
      if (created === false) {
        return;
      }
      setTitle("");
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (id: TaskTypeOption) => {
    if (id === "TODO") {
      return isColumnCompact ? t("todoCompact") : t("todoNormal");
    }
    return id === "HABIT" ? t("habitLabel") : t("dailyLabel");
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-2 p-2.5 rounded-xl border border-primary/45 bg-card shadow-md dark:border-gold/70 dark:bg-primary-dark/40 dark:shadow-glow-gold-xs animate-in fade-in zoom-in-95 duration-150 shrink-0",
        isColumnCompact && "p-2 gap-1.5",
      )}
    >
      {/* Seletor Compacto dos 3 Tipos: A Fazer (padrão), Hábito, Diária */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-neutral-700 dark:bg-surface/80 dark:border-white/10 w-full">
        {QUICK_ADD_TYPE_OPTIONS.map(({ id, icon: Icon, titleKey }) => {
          const isActive = taskType === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setTaskType(id);
                inputRef.current?.focus();
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded-md font-bold transition-colors cursor-pointer",
                isColumnCompact ? "text-tiny" : "text-label-g",
                isActive
                  ? "bg-gold text-on-gold shadow-xs"
                  : "text-neutral-300 dark:text-neutral-400 hover:text-neutral-100 dark:hover:text-neutral-200 hover:bg-card dark:hover:bg-white/5",
              )}
              title={t(titleKey)}
            >
              <Icon size={isColumnCompact ? 11 : 12} className="shrink-0" />
              <span className="truncate">{getTypeLabel(id)}</span>
            </button>
          );
        })}
      </div>

      {/* Input de Título com Placeholder Contextual */}
      <input
        ref={inputRef}
        type="text"
        aria-label={t("titleInputAria")}
        placeholder={
          taskType === "HABIT"
            ? t("habitPlaceholder")
            : taskType === "DAILY"
              ? t("dailyPlaceholder")
              : t("todoPlaceholder")
        }
        value={title}
        maxLength={TASK_TITLE_MAX_LENGTH}
        onChange={(e) =>
          setTitle(e.target.value.slice(0, TASK_TITLE_MAX_LENGTH))
        }
        onKeyDown={async (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await handleSubmit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
        disabled={isSubmitting}
        className="w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs sm:text-sm font-medium outline-none px-1"
      />

      <QuickAddConfigBar
        taskType={taskType}
        dueOffset={dueOffset}
        onDueOffsetChange={handleDueOffsetChange}
        dueTime={dueTime}
        onDueTimeChange={handleDueTimeChange}
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
      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-700/60 dark:border-white/5 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="px-2.5 py-1 rounded-md bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs disabled:bg-neutral-700 disabled:text-neutral-400 disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-xs transition-[transform,background-color] active:scale-95"
          >
            {isSubmitting ? t("creating") : t("createButton")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-md text-neutral-300 dark:text-neutral-400 hover:text-neutral-50 dark:hover:text-neutral-200 text-xs cursor-pointer transition-colors"
          >
            {t("cancelButton")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            const trimmedTitle = title.trim();
            const { initialValues } = buildQuickAddFields(trimmedTitle);
            onOpenDetailedForm?.(
              columnId,
              taskType,
              trimmedTitle,
              initialValues,
            );
          }}
          title={t("moreOptionsTitle")}
          className="text-neutral-300 dark:text-neutral-400 hover:text-primary dark:hover:text-gold flex items-center gap-1 transition-colors cursor-pointer shrink-0 rounded p-1 hover:bg-surface dark:hover:bg-white/5"
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
