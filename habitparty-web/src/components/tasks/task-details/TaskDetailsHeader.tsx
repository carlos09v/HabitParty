"use client";

import { Check, Flame } from "lucide-react";
import type { Task, TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";
import { TaskDatePicker } from "./TaskDatePicker";
import { TaskPriorityPicker } from "./TaskPriorityPicker";

interface TaskDetailsHeaderProps {
  task: Task;
  completed: boolean;
  isHabit: boolean;
  isDaily: boolean;
  isTodo: boolean;
  dueDate: string;
  priority: string;
  onToggleComplete: () => void;
  onDateChange: (newDate: string) => void;
  onPrioritySelect: (p: TaskPriorityOption) => void;
}

export function TaskDetailsHeader({
  task,
  completed,
  isHabit,
  isDaily,
  isTodo,
  dueDate,
  priority,
  onToggleComplete,
  onDateChange,
  onPrioritySelect,
}: TaskDetailsHeaderProps) {
  const streak = task.streak ?? task.currentStreak ?? 0;

  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
      <div className="flex items-center gap-2 min-w-0">
        {/* HÁBITO: Não tem data nem checkbox de conclusão */}
        {isHabit ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded text-tiny font-bold uppercase tracking-wider bg-info/15 border border-info/40 text-info shrink-0">
              Hábito
            </span>
            <span className="text-tiny font-medium text-neutral-400 truncate">
              {task.resetCounter === "WEEKLY"
                ? "Reset semanal"
                : task.resetCounter === "MONTHLY"
                  ? "Reset mensal"
                  : "Reset diário"}
            </span>
            {streak > 0 && (
              <span
                className="flex items-center gap-1 text-tiny text-warning-500 font-bold ml-0.5 shrink-0"
                title="Streak atual"
              >
                <Flame
                  size={12}
                  className="fill-warning-500/20 text-warning-500"
                />
                {streak}
              </span>
            )}
          </div>
        ) : (
          <>
            {/* Checkbox de Conclusão para Diária e To-Do */}
            <button
              type="button"
              onClick={onToggleComplete}
              aria-label={
                completed ? "Marcar como pendente" : "Marcar como concluída"
              }
              className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
                completed
                  ? "bg-gold border-gold text-neutral-900 shadow-glow-gold-xs"
                  : "border-primary/50 bg-primary-dark/40 hover:border-gold",
              )}
            >
              {completed && <Check size={12} className="stroke-3" />}
            </button>

            {/* Separador vertical */}
            <div className="h-4 w-px bg-white/15 shrink-0" />

            {/* Prazo (To-Do) ou Badge Diária */}
            {isTodo ? (
              <TaskDatePicker dueDate={dueDate} onDateChange={onDateChange} />
            ) : isDaily ? (
              <span className="text-tiny font-medium text-magenta bg-magenta/15 border border-magenta/40 px-2 py-0.5 rounded uppercase tracking-wider">
                Diária
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* Canto Superior Direito: Bandeira de Prioridade */}
      <TaskPriorityPicker
        priority={priority}
        onPrioritySelect={onPrioritySelect}
      />
    </div>
  );
}
