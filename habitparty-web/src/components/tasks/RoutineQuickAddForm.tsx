"use client";

import { Calendar, Repeat, SlidersHorizontal, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ALL_WEEK_DAYS } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import type {
  CreateTaskDTO,
  DailyDaysOfWeek,
  HabitTypeOption,
  TaskTypeOption,
} from "@/types/task";
import { cn } from "@/utils";

interface RoutineQuickAddFormProps {
  columnId: string;
  isCompact?: boolean;
  isColumnCompact?: boolean;
  onClose: () => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    type: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<void> | void;
  onOpenDetailedForm?: (
    columnId: string,
    type: TaskTypeOption,
    title: string,
  ) => void;
}

export function RoutineQuickAddForm({
  columnId,
  isCompact = false,
  isColumnCompact = false,
  onClose,
  onQuickCreateTask,
  onOpenDetailedForm,
}: RoutineQuickAddFormProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isCompactMode = isColumnCompact || isCompact;

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskTypeOption>("TODO");
  const [habitType, setHabitType] = useState<HabitTypeOption>("POSITIVE");
  const [resetCounter, setResetCounter] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [dailyFreq, setDailyFreq] = useState<"DAILY" | "WEEKDAYS">("DAILY");
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
          importanceType: "NORMAL",
          difficulty: "EASY",
        };
      } else if (taskType === "DAILY") {
        const weekdays: DailyDaysOfWeek[] = [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ];
        extraPayload = {
          startDate: new Date().toISOString().split("T")[0],
          repeatType: dailyFreq === "WEEKDAYS" ? "WEEKLY" : "DAILY",
          repeatEvery: 1,
          daysOfWeek: dailyFreq === "WEEKDAYS" ? weekdays : ALL_WEEK_DAYS,
          difficulty: "MEDIUM",
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
              ? "bg-gold text-neutral-900 shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title="Tarefa normal com conclusão única"
        >
          <Target size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">
            {isColumnCompact ? "Tarefa" : "A Fazer"}
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
              ? "bg-gold text-neutral-900 shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title="Hábito com contadores de reforço (+/-)"
        >
          <Repeat size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">Hábito</span>
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
              ? "bg-gold text-neutral-900 shadow-xs"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title="Tarefa de rotina periódica que reseta"
        >
          <Calendar size={isColumnCompact ? 11 : 12} className="shrink-0" />
          <span className="truncate">Diária</span>
        </button>
      </div>

      {/* Input de Título com Placeholder Contextual */}
      <input
        ref={inputRef}
        type="text"
        placeholder={
          taskType === "HABIT"
            ? "Qual hábito cultivar? (Enter)"
            : taskType === "DAILY"
              ? "Qual sua rotina? (Enter)"
              : "O que precisa ser feito? (Enter)"
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

      {/* Micro-opções contextuais para Hábito: Estrutura em 2 linhas empilhadas */}
      {taskType === "HABIT" && (
        <div className="flex flex-col gap-1.5 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-neutral-400 font-medium text-tiny shrink-0">
              Tipo:
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
                title="Hábito positivo (+)"
              >
                + Positivo
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
                title="Hábito negativo (-)"
              >
                - Negativo
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
                title="Hábito com reforço positivo (+) e negativo (-)"
              >
                ± Ambos
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-1">
            <span className="text-neutral-400 font-medium text-tiny shrink-0">
              Reset:
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
              title="Alternar ciclo de reset"
            >
              {resetCounter === "DAILY" ? "🔄 Diário" : "📅 Semanal"}
            </button>
          </div>
        </div>
      )}

      {/* Micro-opções contextuais para Diária */}
      {taskType === "DAILY" && (
        <div className="flex items-center justify-between gap-1 text-label-g px-2 py-1.5 bg-white/5 rounded-md border border-white/5">
          <span className="text-neutral-400 font-medium text-tiny shrink-0">
            Frequência:
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
              Todo dia
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
              Seg-Sex
            </button>
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
            className="px-2.5 py-1 rounded-md bg-gold hover:bg-gold-hover text-neutral-900 font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? "Criando..." : "Criar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-md text-neutral-400 hover:text-neutral-200 text-xs cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenDetailedForm?.(columnId, taskType, title);
          }}
          title="Abrir formulário detalhado com mais opções"
          className="text-neutral-400 hover:text-gold flex items-center gap-1 transition-colors cursor-pointer shrink-0 rounded p-1 hover:bg-white/5"
        >
          <SlidersHorizontal size={13} />
          <span
            className={cn(isColumnCompact ? "hidden" : "inline text-label-g")}
          >
            Mais opções
          </span>
        </button>
      </div>
    </div>
  );
}
