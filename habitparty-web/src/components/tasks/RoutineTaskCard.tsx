"use client";

import {
  Calendar,
  CheckSquare,
  ClockAlert,
  Flag,
  MessageSquare,
  Zap,
} from "lucide-react";
import { memo } from "react";
import {
  TaskActionControl,
  TaskRewardBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { TASK_PRIORITY_META } from "@/constants/task";
import { useTaskCardItem } from "@/hooks/useTaskCardItem";
import type { RoutineTaskCardProps } from "@/types/task-ui";
import { cn } from "@/utils";

/**
 * Card arrastável de Tarefa para as colunas do quadro Kanban de Rotina.
 * Desacoplado: consome useTaskCardItem para eliminar duplicações de lógica com RoutineTaskRow.
 */
export const RoutineTaskCard = memo(function RoutineTaskCard({
  task,
  columnId,
  isCompact: propIsCompact,
  onOpenDetails,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  isOverlay = false,
}: RoutineTaskCardProps) {
  const {
    isCompact,
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    isDone,
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    style,
    isHabit,
    isDaily,
    isTodo,
    borderClass,
    dueDateInfo,
    displayTag,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskCardItem({
    task,
    columnId,
    isOverlay,
    isCompact: propIsCompact,
    onToggleCompleted,
    onHabitChange,
  });

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
        "group/card flex flex-col transition-[background-color,border-color,opacity,box-shadow] duration-150 select-none touch-none cursor-pointer",
        isCompact
          ? "gap-2 p-2.5 rounded-lg border border-l-4"
          : "gap-2.5 p-3 rounded-xl border border-l-4",
        "bg-primary-dark/20 border-primary/30",
        isHabit
          ? "hover:bg-primary-dark/35 hover:border-info/40"
          : isDaily
            ? "hover:bg-primary-dark/35 hover:border-magenta/40"
            : "hover:bg-primary-dark/35 hover:border-gold/40",
        "hover:border-y-primary-light/40 hover:border-r-primary-light/40",
        borderClass,
        dueDateInfo.isOverdue &&
          !isDone &&
          !isHardcoreOverdue &&
          "border-danger-500/40 bg-danger-500/[0.03]",
        isHardcoreOverdue &&
          "border-danger-500/70 shadow-[0_0_10px_rgba(239,68,68,0.25)]",
        isDone && "opacity-60",
        isDragging &&
          "!transition-none opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "!transition-none shadow-card-active border-gold/70 bg-primary-dark/60 scale-102 rotate-1 cursor-grabbing z-50",
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
                  ? "px-1 py-0.5 text-label-s font-normal leading-tight max-w-[80px]"
                  : "px-1.5 py-0.5 text-tiny max-w-[100px]",
              )}
              title={displayTag}
            >
              {displayTag}
            </span>
          )}

          {task.tags && task.tags.length > 1 && (
            <span
              className={cn(
                "rounded font-medium bg-white/5 border border-white/10 text-neutral-400 shrink-0 select-none",
                isCompact
                  ? "px-1 py-0.5 text-label-s font-normal leading-tight"
                  : "px-1.5 py-0.5 text-tiny",
              )}
              title={task.tags.slice(1).join(", ")}
            >
              +{task.tags.length - 1}
            </span>
          )}
        </div>

        {/* Indicadores complementares (Bandeira de Prioridade, Hardcore, Descrição e Grip de Arrasto) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {task.priority &&
            (task.priority as string).toUpperCase() !== "NONE" && (
              <span
                title={`Prioridade: ${TASK_PRIORITY_META[task.priority]?.label || task.priority}`}
                className={cn(
                  "p-0.5 rounded border flex items-center justify-center transition-all select-none shrink-0",
                  TASK_PRIORITY_META[task.priority]?.badgeColor ||
                    "text-neutral-400 bg-white/5 border-white/10",
                )}
              >
                <Flag size={isCompact ? 9 : 11} />
              </span>
            )}

          {task.isHardcoreModeEnabled && (
            <span
              title={
                isHardcoreOverdue
                  ? "Modo Hardcore: Prazo fatal expirado! Penalidade de 50% ativa!"
                  : "Modo Hardcore Ativo"
              }
              className={cn(
                "transition-colors",
                isHardcoreOverdue
                  ? "text-danger-500 animate-pulse"
                  : "text-warning-500 hover:text-warning-hover",
              )}
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
        </div>
      </div>

      {/* 2. MEIO: Controle de Ação + Título da Tarefa */}
      <div className="flex items-start gap-2 min-w-0">
        <TaskActionControl
          task={task}
          isHabit={isHabit}
          isDaily={isDaily}
          completed={completed}
          onToggle={toggleCompleted}
          onDelta={changeHabit}
          isCompact={isCompact}
        />

        <span
          className={cn(
            "font-medium text-neutral-100 leading-snug line-clamp-2 min-w-0 break-words",
            isCompact ? "text-xs" : "text-sm",
            isDone && "line-through text-neutral-400",
          )}
        >
          {task.title}
        </span>
      </div>

      {/* 3. BASE: Frequência/Prazo/Saldo + Ofensiva (Streak) */}
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
            <div
              className={cn(
                "flex items-center gap-1 font-medium truncate",
                dueDateInfo.isOverdue
                  ? "text-danger-500 font-semibold bg-danger-500/10 px-1.5 py-0.5 rounded border border-danger-500/30"
                  : dueDateInfo.isToday
                    ? "text-gold font-semibold"
                    : "text-neutral-300",
              )}
            >
              {dueDateInfo.isOverdue ? (
                <ClockAlert
                  size={isCompact ? 10 : 12}
                  className="shrink-0 text-danger-500"
                />
              ) : (
                <Calendar
                  size={isCompact ? 10 : 12}
                  className={cn(
                    "shrink-0",
                    dueDateInfo.isToday ? "text-gold" : "text-neutral-400",
                  )}
                />
              )}
              <span className="truncate">{dueDateInfo.label}</span>
            </div>
          )}

          {hasChecklist && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium rounded border px-1.5 py-0.5 shrink-0",
                isCompact ? "text-label-s leading-none" : "text-tiny",
                isChecklistAllDone
                  ? "text-success-500 bg-success-500/10 border-success-500/30 font-semibold"
                  : "text-neutral-300 bg-white/5 border-white/10",
              )}
              title={`Subtarefas: ${checklistCompleted} de ${checklistTotal} concluídas`}
            >
              <CheckSquare
                size={isCompact ? 9 : 11}
                className={
                  isChecklistAllDone ? "text-success-500" : "text-neutral-400"
                }
              />
              <span>
                {checklistCompleted}/{checklistTotal}
              </span>
            </span>
          )}

          {isHabit && (
            <span
              className={cn(
                "font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                isCompact ? "text-label-s" : "text-tiny",
                habitScore >= 0
                  ? "text-success-500 bg-success-500/10"
                  : "text-danger-500 bg-danger-500/10",
              )}
              title={`Saldo de repetições realizadas no ciclo atual: ${habitScore >= 0 ? `+${habitScore}` : habitScore}`}
            >
              <span>{habitScore > 0 ? `+${habitScore}` : habitScore}</span>
              <span className="font-normal opacity-70">
                {task.resetCounter === "WEEKLY"
                  ? "semana"
                  : task.resetCounter === "MONTHLY"
                    ? "mês"
                    : "hoje"}
              </span>
            </span>
          )}
        </div>

        <TaskRewardBadges
          task={task}
          isCompact={isCompact}
          showStreak={true}
          showRewards={false}
        />
      </div>
    </div>
  );
});
