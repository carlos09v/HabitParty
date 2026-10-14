"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical, MessageSquare, Zap } from "lucide-react";
import { memo } from "react";
import {
  TaskActionControl,
  TaskRewardBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { getTaskBorderClass, normalizeTaskType } from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import type { RoutineTaskCardProps } from "@/types/task";
import { cn } from "@/utils";

/**
 * Card arrastável de Tarefa para as colunas do quadro Kanban de Rotina.
 * Client Component: utiliza @dnd-kit para sortable e subcomponentes atômicos compartilhados.
 */
export const RoutineTaskCard = memo(function RoutineTaskCard({
  task,
  columnId,
  onOpenDetails,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  isOverlay = false,
}: RoutineTaskCardProps) {
  const { isCompact } = useCompactMode();

  const { completed, habitScore, toggleCompleted, changeHabit, isDone } =
    useTaskProgress(task, {
      onToggle: onToggleCompleted,
      onHabitChange,
    });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
      columnId,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";
  const borderClass = getTaskBorderClass(task);

  const displayTag =
    task.tags && task.tags.length > 0
      ? task.tags[0]
      : task.category && task.category !== "Geral"
        ? task.category
        : null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Dnd-kit sortable task card containing inner action buttons
    // biome-ignore lint/a11y/noStaticElementInteractions: Dnd-kit sortable task card containing inner action buttons
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging && onOpenDetails) {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          onOpenDetails(task, columnId, rect);
        }
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, task, columnId);
        }
      }}
      className={cn(
        "group/card flex flex-col transition-all select-none touch-none cursor-pointer",
        isCompact
          ? "gap-2 p-2.5 rounded-lg border border-l-4"
          : "gap-2.5 p-3 rounded-xl border border-l-4",
        "bg-primary-dark/20 border-primary/30 hover:bg-primary-dark/35",
        "hover:border-y-primary-light/40 hover:border-r-primary-light/40",
        borderClass,
        isDone && "opacity-60",
        isDragging && "opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "shadow-card-active border-gold/70 bg-primary-dark/60 scale-102 rotate-1 cursor-grabbing z-50",
      )}
    >
      {/* 1. TOPO: Badge do Tipo + Tag Opcional + Indicadores e Grip */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <TaskTypeBadge task={task} isCompact={isCompact} />

          {displayTag && (
            <span
              className={cn(
                "rounded font-medium bg-white/5 border border-white/10 text-neutral-300 truncate",
                isCompact
                  ? "px-1 py-0.5 text-[8px] font-normal leading-tight max-w-[90px]"
                  : "px-1.5 py-0.5 text-tiny max-w-[110px]",
              )}
              title={displayTag}
            >
              {displayTag}
            </span>
          )}
        </div>

        {/* Indicadores complementares (Hardcore, Ícone de Descrição e Grip de Arrasto) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {task.isHardcoreModeEnabled && (
            <span
              title="Modo Hardcore Ativo"
              className="text-warning-500 hover:text-warning-hover transition-colors"
            >
              <Zap size={isCompact ? 10 : 12} />
            </span>
          )}

          {task.description && (
            <span
              title="Possui descrição detalhada (clique no card para visualizar)"
              className="text-neutral-400 hover:text-gold transition-colors p-0.5"
            >
              <MessageSquare size={isCompact ? 10 : 12} />
            </span>
          )}

          <div
            className="text-neutral-500 group-hover/card:text-neutral-300 transition-colors p-0.5 cursor-grab active:cursor-grabbing"
            title="Arrastar tarefa"
          >
            <GripVertical size={isCompact ? 11 : 13} />
          </div>
        </div>
      </div>

      {/* 2. MEIO: Controle de Ação + Título da Tarefa */}
      <div className="flex items-start gap-2 min-w-0">
        <TaskActionControl
          task={task}
          isHabit={isHabit}
          completed={completed}
          onToggle={toggleCompleted}
          onDelta={changeHabit}
          isCompact={isCompact}
        />

        <span
          className={cn(
            "font-medium text-neutral-100 leading-snug line-clamp-2 min-w-0 break-words",
            isCompact ? "text-label-g" : "text-xs",
            isDone && "line-through text-neutral-400",
          )}
        >
          {task.title}
        </span>
      </div>

      {/* 3. BASE: Frequência/Prazo/Saldo + Recompensas */}
      <div
        className={cn(
          "flex items-center justify-between text-neutral-400 border-t border-white/5",
          isCompact ? "pt-1 text-label-s" : "pt-1.5 text-tiny",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isDaily && (
            <WeekDaysIndicator
              daysOfWeek={task.daysOfWeek}
              isCompact={isCompact}
            />
          )}

          {isTodo && (
            <div className="flex items-center gap-1 text-gold font-medium truncate">
              <Calendar
                size={isCompact ? 10 : 12}
                className="text-gold shrink-0"
              />
              <span className="truncate">{task.dueDate || "Sem prazo"}</span>
            </div>
          )}

          {isHabit && (
            <span
              className={cn(
                "font-bold px-1.5 py-0.5 rounded",
                isCompact ? "text-label-s" : "text-tiny",
                habitScore >= 0
                  ? "text-success-500 bg-success-500/10"
                  : "text-danger-500 bg-danger-500/10",
              )}
              title="Saldo do hábito"
            >
              {habitScore > 0 ? `+${habitScore}` : habitScore}
            </span>
          )}
        </div>

        <TaskRewardBadges task={task} isCompact={isCompact} showStreak={true} />
      </div>
    </div>
  );
});
