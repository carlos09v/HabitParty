import { Check, Minus, Plus } from "lucide-react";
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
            onClick={(e) => {
              e.stopPropagation();
              onDelta?.(1);
            }}
            title="Registrar hábito positivo (+)"
            aria-label="Registrar hábito positivo"
            className={cn(
              "rounded bg-success-500/20 border border-success-500/40 text-success-500 hover:bg-success-500 hover:text-neutral-900 flex items-center justify-center font-bold transition-all cursor-pointer shadow-2xs active:scale-95",
              isCompact ? "w-4 h-4 text-label-m" : "w-5 h-5 text-tiny",
            )}
          >
            <Plus size={isCompact ? 9 : 12} className="stroke-3" />
          </button>
        )}
        {showNegative && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelta?.(-1);
            }}
            title="Registrar hábito negativo (-)"
            aria-label="Registrar hábito negativo"
            className={cn(
              "rounded bg-danger-500/20 border border-danger-500/40 text-danger-500 hover:bg-danger-500 hover:text-neutral-100 flex items-center justify-center font-bold transition-all cursor-pointer shadow-2xs active:scale-95",
              isCompact ? "w-4 h-4 text-label-m" : "w-5 h-5 text-tiny",
            )}
          >
            <Minus size={isCompact ? 9 : 12} className="stroke-3" />
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
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-label={completed ? "Marcar como pendente" : "Marcar como concluída"}
      className={cn(
        "border flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95",
        isDaily ? "rounded-full" : "rounded-md",
        isCompact ? "w-3.5 h-3.5" : "w-4.5 h-4.5",
        completed
          ? "bg-gold border-gold text-neutral-900 shadow-glow-gold-xs"
          : isDaily
            ? "border-magenta/50 bg-magenta/10 hover:border-magenta"
            : "border-primary/50 bg-primary-dark/40 hover:border-gold",
        className,
      )}
    >
      {completed && (
        <Check
          size={isCompact ? 9 : 12}
          className="stroke-3 text-neutral-900"
        />
      )}
    </button>
  );
}
