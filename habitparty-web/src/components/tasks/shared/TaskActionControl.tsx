import { Check, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

interface TaskActionControlProps {
  task: Task;
  isHabit: boolean;
  isDaily?: boolean;
  completed?: boolean;
  onToggle?: () => void;
  onDelta?: (delta: number) => void;
  isCompact?: boolean;
  className?: string;
}

/**
 * Controle de ação padronizado para tarefas:
 * - Checkbox de conclusão para To-Do (quadrado) e Diárias (circular).
 * - Botões de incremento/decremento (+/-) para Hábitos.
 */
export function TaskActionControl({
  task,
  isHabit,
  isDaily: propIsDaily,
  completed = false,
  onToggle,
  onDelta,
  isCompact = false,
  className,
}: TaskActionControlProps) {
  const t = useTranslations("dashboard.taskShared.actions");

  if (isHabit) {
    const showPositive =
      task.habitType === "POSITIVE" ||
      task.habitType === "BOTH" ||
      !task.habitType;
    const showNegative =
      task.habitType === "NEGATIVE" || task.habitType === "BOTH";

    return (
      <div className={cn("flex items-center gap-1 shrink-0", className)}>
        {showPositive && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelta?.(1);
            }}
            title={t("positiveHabitTitle")}
            aria-label={t("positiveHabitAria")}
            className={cn(
              "rounded-md bg-success-500/20 border border-success-500/50 text-success-500 hover:bg-success-500 hover:border-success-500 hover:text-on-gold hover:shadow-[0_0_10px_rgba(0,201,80,0.35)] flex items-center justify-center font-bold transition-all cursor-pointer shadow-2xs active:scale-90",
              isCompact ? "w-5 h-5 text-label-m" : "w-6 h-6 text-tiny",
            )}
          >
            <Plus size={isCompact ? 11 : 13} className="stroke-3" />
          </button>
        )}
        {showNegative && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelta?.(-1);
            }}
            title={t("negativeHabitTitle")}
            aria-label={t("negativeHabitAria")}
            className={cn(
              "rounded-md bg-danger-500/20 border border-danger-500/50 text-danger-500 hover:bg-danger-500 hover:border-danger-500 hover:text-white hover:shadow-[0_0_10px_rgba(251,44,54,0.35)] flex items-center justify-center font-bold transition-all cursor-pointer shadow-2xs active:scale-90",
              isCompact ? "w-5 h-5 text-label-m" : "w-6 h-6 text-tiny",
            )}
          >
            <Minus size={isCompact ? 11 : 13} className="stroke-3" />
          </button>
        )}
      </div>
    );
  }

  const isDaily =
    propIsDaily ??
    (Boolean(task.repeatType) ||
      (Array.isArray(task.daysOfWeek) && task.daysOfWeek.length > 0) ||
      (task.type || "").toLowerCase() === "daily");

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-label={completed ? t("markPendingAria") : t("markCompletedAria")}
      className={cn(
        "border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90",
        isDaily ? "rounded-full" : "rounded-md",
        isCompact ? "w-4 h-4" : "w-5 h-5",
        completed
          ? "bg-gold border-gold text-on-gold shadow-glow-gold-xs"
          : isDaily
            ? "border-magenta/60 bg-magenta/10 hover:border-magenta hover:bg-magenta/20 hover:shadow-glow-magenta"
            : "border-primary-light/55 bg-primary-dark/40 hover:border-gold hover:bg-gold/15 hover:shadow-glow-gold-xs",
        className,
      )}
    >
      {completed && (
        <Check size={isCompact ? 10 : 12} className="stroke-3 text-on-gold" />
      )}
    </button>
  );
}
