"use client";

import {
  Calendar,
  CalendarClock,
  Repeat,
  SlidersHorizontal,
  Sword,
  Swords,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  ALL_WEEK_DAYS,
  HABIT_IMPORTANCE_OPTIONS,
  TASK_DIFFICULTY_OPTIONS,
  WEEKDAYS_ONLY,
} from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useExperienceMode } from "@/hooks/useExperienceMode";
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

const DIFFICULTY_DOT: Record<TaskDifficultyOption, string> = {
  TRIVIAL: "bg-info",
  EASY: "bg-success-500",
  MEDIUM: "bg-warning-500",
  HARD: "bg-purple-400",
};

const DIFFICULTY_SWORD_TEXT: Record<TaskDifficultyOption, string> = {
  TRIVIAL: "text-info",
  EASY: "text-success-500",
  MEDIUM: "text-warning-500",
  HARD: "text-purple-400",
};

const IMPORTANCE_DOT: Record<HabitImportanceOption, string> = {
  LOW: "bg-info",
  NORMAL: "bg-success-500",
  HIGH: "bg-purple-400",
};

export function RoutineQuickAddForm({
  columnId,
  isCompact = false,
  isColumnCompact = false,
  onClose,
  onQuickCreateTask,
  onOpenDetailedForm,
}: RoutineQuickAddFormProps) {
  const t = useTranslations("tasks.quickAdd");
  const tOptions = useTranslations("tasks.options");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCompactMode = isColumnCompact || isCompact;
  const { isGamified } = useExperienceMode();

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

      {/* Micro-opções contextuais para A Fazer (To-Do): Prazo rápido + Dificuldade */}
      {taskType === "TODO" && (
        <div className="flex flex-col gap-1.5 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
          {/* Linha 1: Prazo Rápido */}
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
                      setDueOffset(opt.offset);
                      inputRef.current?.focus();
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

          {/* Linha 2: Dificuldade */}
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
                      setDifficulty(opt.id);
                      inputRef.current?.focus();
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
                        className={cn(
                          "shrink-0",
                          DIFFICULTY_SWORD_TEXT[opt.id],
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          DIFFICULTY_DOT[opt.id],
                        )}
                      />
                    )}
                    <span>{tOptions(`difficulties.${opt.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Micro-opções contextuais para Hábito: Direção + Importância + Reset */}
      {taskType === "HABIT" && (
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
                  setHabitType("POSITIVE");
                  inputRef.current?.focus();
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
                  setHabitType("NEGATIVE");
                  inputRef.current?.focus();
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
                  setHabitType("BOTH");
                  inputRef.current?.focus();
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
                      setImportanceType(imp.id);
                      inputRef.current?.focus();
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
                        IMPORTANCE_DOT[imp.id],
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
                setResetCounter((prev) =>
                  prev === "DAILY" ? "WEEKLY" : "DAILY",
                );
                inputRef.current?.focus();
              }}
              className="text-tiny text-neutral-300 hover:text-gold transition-colors font-medium cursor-pointer px-1 py-0.5 rounded hover:bg-white/5"
              title={t("toggleResetTitle")}
            >
              {resetCounter === "DAILY" ? t("resetDaily") : t("resetWeekly")}
            </button>
          </div>
        </div>
      )}

      {/* Micro-opções contextuais para Diária: Frequência + Dificuldade */}
      {taskType === "DAILY" && (
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
                  setDailyFreq("DAILY");
                  inputRef.current?.focus();
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
                  setDailyFreq("WEEKDAYS");
                  inputRef.current?.focus();
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
                      setDifficulty(opt.id);
                      inputRef.current?.focus();
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
                        className={cn(
                          "shrink-0",
                          DIFFICULTY_SWORD_TEXT[opt.id],
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          DIFFICULTY_DOT[opt.id],
                        )}
                      />
                    )}
                    <span>{tOptions(`difficulties.${opt.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
