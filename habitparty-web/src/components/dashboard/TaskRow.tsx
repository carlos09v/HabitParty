"use client";

import { MoreHorizontal } from "lucide-react";
import {
  TaskActionControl,
  TaskRewardBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { getTaskBorderClass, normalizeTaskType } from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import type { TaskRowProps } from "@/types/task";
import { cn } from "@/utils";

/**
 * Linha da Tabela de Tarefas no Dashboard.
 * Client Component: gerencia interatividade local (conclusão e saldo) via useTaskProgress
 * e utiliza subcomponentes atômicos compartilhados.
 */
export function TaskRow({ task, onToggle, onHabitChange }: TaskRowProps) {
  const { isCompact } = useCompactMode();
  const { completed, habitScore, toggleCompleted, changeHabit, isDone } =
    useTaskProgress(task, {
      onToggle,
      onHabitChange,
    });

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";
  const borderClass = getTaskBorderClass(task);

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_36px] items-center rounded-lg border transition-all",
        isCompact ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3",
        "bg-primary-dark/20 border-primary/30 hover:border-y-primary-light/40 hover:border-r-primary-light/40 hover:bg-primary-dark/30",
        borderClass,
        "border-l-4",
        isDone && "opacity-60",
      )}
    >
      {/* Coluna 1: Ação + Título + Metadados (Streak, Recompensas e Saldo de Hábito) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <TaskActionControl
          task={task}
          isHabit={isHabit}
          completed={completed}
          onToggle={toggleCompleted}
          onDelta={changeHabit}
          isCompact={isCompact}
        />

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "font-medium text-neutral-100 truncate",
              isCompact ? "text-xs" : "text-body-s",
              isDone && "line-through text-neutral-400",
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-2 text-label-g text-neutral-400">
            <TaskRewardBadges
              task={task}
              isCompact={isCompact}
              showStreak={true}
            />

            {isHabit && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    "font-bold text-label-m px-1.5 py-0.5 rounded",
                    habitScore >= 0
                      ? "text-success-500 bg-success-500/10"
                      : "text-danger-500 bg-danger-500/10",
                  )}
                >
                  Saldo: {habitScore > 0 ? `+${habitScore}` : habitScore}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coluna 2: Categoria / Coluna */}
      <div className="flex items-center">
        <span
          className={cn(
            "rounded font-medium bg-white/5 border border-white/10 text-neutral-200 truncate",
            isCompact ? "px-1.5 py-0.5 text-tiny" : "px-2 py-0.5 text-xs",
          )}
        >
          {task.category || "-"}
        </span>
      </div>

      {/* Coluna 3: Badge do Tipo */}
      <div className="flex items-center">
        <TaskTypeBadge task={task} isCompact={isCompact} />
      </div>

      {/* Coluna 4: Frequência / Prazo */}
      <div className="flex items-center min-w-0">
        {isDaily ? (
          <WeekDaysIndicator
            daysOfWeek={task.daysOfWeek}
            isCompact={isCompact}
          />
        ) : isTodo ? (
          <span className="text-body-s text-neutral-300 font-medium truncate">
            {task.dueDate || "Sem prazo"}
          </span>
        ) : (
          <span className="text-body-s text-neutral-400 font-medium truncate">
            {task.resetCounter === "DAILY"
              ? "Diário"
              : task.resetCounter === "WEEKLY"
                ? "Semanal"
                : task.resetCounter === "MONTHLY"
                  ? "Mensal"
                  : "Contínuo"}
          </span>
        )}
      </div>

      {/* Coluna 5: Ações */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          aria-label="Mais opções da tarefa"
          className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
