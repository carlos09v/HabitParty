"use client";

import {
  CheckSquare,
  Flag,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Zap,
} from "lucide-react";
import { memo } from "react";
import {
  TaskActionControl,
  TaskRewardBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { useTaskCardItem } from "@/hooks/useTaskCardItem";
import type { TaskRowProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { getClickAnchorRect } from "@/utils/dom";

/**
 * Linha de Tarefa Unificada (Dashboard & Quadro Kanban em Lista).
 * Suporta modo estático tabular (Dashboard) e modo arrastável com dnd-kit (Kanban).
 */
export const TaskRow = memo(function TaskRow({
  task,
  columnId = task.columnId,
  columnTitle = task.category,
  activeFilter,
  selectedDate,
  isSortable = false,
  isOverlay = false,
  isCompact: propIsCompact,
  onToggle,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  onOpenDetails,
}: TaskRowProps) {
  const effectiveToggle = onToggleCompleted || onToggle;

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
    hasExtraTags,
    extraTagsCount,
    priorityMeta,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskCardItem({
    task,
    columnId,
    isOverlay,
    isSortable,
    isCompact: propIsCompact,
    onToggleCompleted: effectiveToggle,
    onHabitChange,
    useTranslateTransform: true,
    activeFilter,
    selectedDate,
  });

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDragging && onOpenDetails) {
      e.stopPropagation();
      const anchor = getClickAnchorRect(e);
      onOpenDetails(task, anchor);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, task, columnId);
    }
  };

  const ElementTag = isSortable ? "li" : "div";

  return (
    <ElementTag
      ref={setNodeRef}
      style={style}
      {...(isSortable ? attributes : {})}
      {...(isSortable ? listeners : {})}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)_auto_40px] sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_minmax(0,1fr)_40px] md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_40px] items-center rounded-xl border transition-[background-color,border-color,opacity,box-shadow] duration-150 select-none group overflow-hidden",
        isSortable
          ? "cursor-grab active:cursor-grabbing touch-none"
          : "cursor-pointer",
        isCompact
          ? "gap-2.5 px-3 py-2 text-xs"
          : "gap-4 px-4 py-2.5 text-body-s",
        "bg-primary-dark/20 border-primary/30 hover:border-gold/50 hover:bg-primary-dark/35 hover:shadow-card-deep focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60",
        borderClass,
        "border-l-4",
        isHardcoreOverdue &&
          "border-danger-500/70 shadow-[0_0_10px_rgba(239,68,68,0.25)]",
        isDone && "opacity-60",
        isDragging &&
          "!transition-none opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "!transition-none shadow-card-active border-gold/70 bg-surface/90 scale-102 cursor-grabbing z-50",
      )}
    >
      {/* Coluna 1: [Grip opcional] + Ação + Título + Metadados (Streak, Recompensas e Saldo) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isSortable && (
          <div
            className="w-5 h-5 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-gold transition-colors p-0.5 pointer-events-none"
            aria-hidden="true"
          >
            <GripVertical size={isCompact ? 13 : 15} />
          </div>
        )}

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Evita propagação de clique para o pai */}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <TaskActionControl
            task={task}
            isHabit={isHabit}
            isDaily={isDaily}
            completed={completed}
            onToggle={toggleCompleted}
            onDelta={changeHabit}
            isCompact={isCompact}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span
              className={cn(
                "font-medium text-neutral-100 truncate group-hover:text-gold transition-colors",
                isCompact ? "text-xs" : "text-sm",
                isDone && "line-through text-neutral-400",
              )}
              title={task.title}
            >
              {task.title}
            </span>

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

            {task.isHardcoreModeEnabled && (
              <span
                title={
                  isHardcoreOverdue
                    ? "Modo Hardcore: Prazo fatal expirado! Penalidade de 50% ativa!"
                    : "Modo Hardcore"
                }
                className={cn(
                  "shrink-0 transition-colors",
                  isHardcoreOverdue
                    ? "text-danger-500 animate-pulse"
                    : "text-warning-500",
                )}
              >
                <Zap size={isCompact ? 10 : 12} />
              </span>
            )}

            {task.description && (
              <span
                title="Possui descrição detalhada"
                className="text-neutral-400 shrink-0"
              >
                <MessageSquare size={isCompact ? 10 : 12} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-label-g text-neutral-400">
            {isHabit ? (
              <span
                className={cn(
                  "font-bold text-label-m px-1.5 py-0.5 rounded",
                  habitScore >= 0
                    ? "text-success-500 bg-success-500/10"
                    : "text-danger-500 bg-danger-500/10",
                )}
                title={`Saldo de repetições realizadas: ${habitScore >= 0 ? `+${habitScore}` : habitScore}`}
              >
                Saldo: {habitScore > 0 ? `+${habitScore}` : habitScore}
              </span>
            ) : (
              <TaskRewardBadges
                task={task}
                isCompact={isCompact}
                showStreak={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Coluna 2: Categoria / Coluna */}
      <div className="hidden sm:flex items-center gap-1 min-w-0">
        <span
          className={cn(
            "rounded font-medium bg-white/5 border border-white/10 text-neutral-200 truncate",
            isCompact ? "px-1.5 py-0.5 text-tiny" : "px-2 py-0.5 text-xs",
          )}
          title={columnTitle || displayTag || "Geral"}
        >
          {columnTitle || displayTag || "-"}
        </span>
        {hasExtraTags && (
          <span
            className={cn(
              "rounded font-medium bg-white/5 border border-white/10 text-neutral-400 shrink-0 select-none",
              isCompact
                ? "px-1 py-0.5 text-label-s"
                : "px-1.5 py-0.5 text-tiny",
            )}
            title={task.tags?.slice(1).join(", ")}
          >
            +{extraTagsCount}
          </span>
        )}
      </div>

      {/* Coluna 3: Badge do Tipo */}
      <div className="flex items-center">
        <TaskTypeBadge task={task} isCompact={isCompact} />
      </div>

      {/* Coluna 4: Prioridade */}
      <div className="hidden sm:flex items-center min-w-0">
        {priorityMeta ? (
          <span
            className={cn(
              "p-1 rounded-md border flex items-center justify-center transition-all select-none shrink-0",
              priorityMeta.badgeColor,
            )}
            title={`Prioridade ${priorityMeta.label}`}
          >
            <Flag size={isCompact ? 9 : 11} />
          </span>
        ) : (
          <span className="text-neutral-500 text-tiny font-normal italic">
            -
          </span>
        )}
      </div>

      {/* Coluna 5: Frequência / Prazo */}
      <div className="hidden md:flex items-center min-w-0">
        {isDaily ? (
          <WeekDaysIndicator
            daysOfWeek={task.daysOfWeek}
            isCompact={isCompact}
          />
        ) : isTodo ? (
          <span
            className={cn(
              "text-body-s font-medium truncate",
              dueDateInfo.isOverdue
                ? "text-danger-500 font-medium"
                : dueDateInfo.isToday
                  ? "text-gold font-semibold"
                  : dueDateInfo.hasDueDate
                    ? "text-neutral-300"
                    : "text-neutral-400 font-normal",
            )}
          >
            {dueDateInfo.label}
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

      {/* Coluna 6: Ações (Dispara Menu de Opções) */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e, task, columnId);
            }
          }}
          aria-label={`Opções da tarefa ${task.title}`}
          title="Opções da tarefa (Editar, Duplicar, Excluir)"
          className="p-1 rounded text-neutral-400 group-hover:text-neutral-200 hover:!text-gold hover:!bg-white/10 focus:outline-none focus:ring-1 focus:ring-gold/60 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={isCompact ? 14 : 16} />
        </button>
      </div>
    </ElementTag>
  );
});
