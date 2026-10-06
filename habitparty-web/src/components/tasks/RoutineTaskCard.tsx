"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Check,
  Coins,
  Flame,
  GripVertical,
  MessageSquare,
  Minus,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import { memo, useState } from "react";
import {
  getTaskBorderClass,
  normalizeTaskType,
  TASK_TYPE_META,
  WEEK_DAYS,
} from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineTaskCardProps } from "@/types/task";
import { cn } from "@/utils";

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
  const [completed, setCompleted] = useState(Boolean(task.completed));
  const [score, setScore] = useState(
    (task.positiveCount || 0) - (task.negativeCount || 0),
  );

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

  const typeMeta = TASK_TYPE_META[taskType] || TASK_TYPE_META.todo;
  const borderClass = getTaskBorderClass(task);

  const handleToggle = () => {
    const next = !completed;
    setCompleted(next);
    onToggleCompleted?.(task.id, next);
  };

  const handleDelta = (delta: number) => {
    setScore((prev) => prev + delta);
    onHabitChange?.(task.id, delta);
  };

  const showPositive =
    task.habitType === "POSITIVE" ||
    task.habitType === "BOTH" ||
    !task.habitType;
  const showNegative =
    task.habitType === "NEGATIVE" || task.habitType === "BOTH";

  const displayTag =
    task.tags && task.tags.length > 0
      ? task.tags[0]
      : task.category && task.category !== "Geral"
        ? task.category
        : null;

  // Regra fundamental: Ícone de streak (chama) NUNCA é exibido em Afazeres (To-Do)
  const showStreak =
    !isTodo && typeof task.streak === "number" && task.streak > 0;

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
        completed && !isHabit && "opacity-60",
        isDragging && "opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "shadow-card-active border-gold/70 bg-primary-dark/60 scale-102 rotate-1 cursor-grabbing z-50",
      )}
    >
      {/* 1. TOPO: Badge do Tipo + Tag Opcional + Indicadores de Detalhes + Grip */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {/* Badge explícito do Tipo da Tarefa */}
          <span
            className={cn(
              "rounded font-bold border truncate tracking-wide uppercase shadow-2xs shrink-0",
              isCompact
                ? "px-1.5 py-0.5 text-label-s"
                : "px-2 py-0.5 text-label-m",
              typeMeta.color,
            )}
          >
            {typeMeta.label}
          </span>

          {/* Tag ou Categoria da Tarefa */}
          {displayTag && (
            <span
              className={cn(
                "rounded font-medium bg-white/6 border border-white/10 text-neutral-300 truncate max-w-[110px]",
                isCompact
                  ? "px-1 py-0.5 text-label-s"
                  : "px-1.5 py-0.5 text-tiny",
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

          {/* Ícone indicando que há descrição/comentário (não exibe o texto no card) */}
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

      {/* 2. MEIO: Ação (Checkbox para Diária/Todo ou Contadores +/- para Hábito) + Título */}
      <div className="flex items-start gap-2 min-w-0">
        {isHabit ? (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {showPositive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelta(1);
                }}
                title="Ação positiva (+)"
                className={cn(
                  "rounded bg-success-500/20 border border-success-500/40 text-success-500 hover:bg-success-500 hover:text-neutral-900 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95",
                  isCompact ? "w-4 h-4 text-label-m" : "w-4.5 h-4.5 text-tiny",
                )}
              >
                <Plus size={isCompact ? 9 : 10} className="stroke-3" />
              </button>
            )}
            {showNegative && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelta(-1);
                }}
                title="Ação negativa (-)"
                className={cn(
                  "rounded bg-danger-500/20 border border-danger-500/40 text-danger-500 hover:bg-danger-500 hover:text-neutral-100 flex items-center justify-center font-bold transition-all cursor-pointer active:scale-95",
                  isCompact ? "w-4 h-4 text-label-m" : "w-4.5 h-4.5 text-tiny",
                )}
              >
                <Minus size={isCompact ? 9 : 10} className="stroke-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            aria-label={
              completed ? "Marcar como pendente" : "Marcar como concluída"
            }
            className={cn(
              "rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 active:scale-95",
              isCompact ? "w-3.5 h-3.5" : "w-4 h-4",
              completed
                ? "bg-gold border-gold text-neutral-900 shadow-glow-gold-xs"
                : "border-primary/50 bg-primary-dark/40 hover:border-gold",
            )}
          >
            {completed && (
              <Check size={isCompact ? 9 : 10} className="stroke-3" />
            )}
          </button>
        )}

        <span
          className={cn(
            "font-medium text-neutral-100 leading-snug line-clamp-2 min-w-0 break-words",
            isCompact ? "text-label-g" : "text-xs",
            completed && !isHabit && "line-through text-neutral-400",
          )}
        >
          {task.title}
        </span>
      </div>

      {/* 3. BASE (RODAPÉ UNIFICADO): Dias da Semana para Diária, Prazo para To-Do, Saldo para Hábito + Recompensas */}
      <div
        className={cn(
          "flex items-center justify-between text-neutral-400 border-t border-white/6",
          isCompact ? "pt-1 text-label-s" : "pt-1.5 text-tiny",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {/* DIÁRIA: Dias da Semana redondos, elegantes e com destaque */}
          {isDaily && (
            <div
              className="flex items-center gap-0.5"
              title="Dias ativos da semana"
            >
              {WEEK_DAYS.map((day) => {
                // Se daysOfWeek tiver itens, acende apenas os selecionados. Se for nulo/vazio em Diária, acende todos os dias.
                const isActive =
                  !task.daysOfWeek || task.daysOfWeek.length === 0
                    ? true
                    : task.daysOfWeek.includes(day.enumValue);

                return (
                  <span
                    key={day.enumValue}
                    title={`${day.fullName}: ${isActive ? "Ativo" : "Inativo"}`}
                    className={cn(
                      "rounded-full flex items-center justify-center font-bold transition-all",
                      isCompact
                        ? "w-4 h-4 text-[8px]"
                        : "w-4.5 h-4.5 text-[9px]",
                      isActive
                        ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-extrabold"
                        : "bg-white/5 text-neutral-500 border border-white/5",
                    )}
                  >
                    {day.shortLabel}
                  </span>
                );
              })}
            </div>
          )}

          {/* AFAZER (To-Do): Prazo de entrega com ícone de calendário (SEM linha solta sob o título) */}
          {isTodo && (
            <div className="flex items-center gap-1 text-gold font-medium truncate">
              <Calendar
                size={isCompact ? 10 : 12}
                className="text-gold shrink-0"
              />
              <span className="truncate">{task.dueDate || "Sem prazo"}</span>
            </div>
          )}

          {/* HÁBITO: Saldo acumulado */}
          {isHabit && (
            <span
              className={cn(
                "font-bold px-1.5 py-0.5 rounded",
                isCompact ? "text-label-s" : "text-tiny",
                score >= 0
                  ? "text-success-500 bg-success-500/10"
                  : "text-danger-500 bg-danger-500/10",
              )}
              title="Saldo do hábito"
            >
              {score > 0 ? `+${score}` : score}
            </span>
          )}

          {/* Chama de ofensiva (Streak): Apenas Diária e Hábito se streak > 0 */}
          {showStreak && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-warning-500 font-bold ml-0.5",
                isCompact ? "text-label-s" : "text-tiny",
              )}
              title={`Ofensiva de ${task.streak} dia(s)`}
            >
              <Flame
                size={isCompact ? 9 : 11}
                className="fill-warning-500 text-warning-500"
              />
              {task.streak}
            </span>
          )}
        </div>

        {/* Recompensas: XP e Ouro */}
        <div
          className={cn(
            "flex items-center shrink-0",
            isCompact ? "gap-1" : "gap-1.5",
          )}
        >
          {task.rewardXp !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-magenta font-medium",
                isCompact ? "text-label-s" : "text-tiny",
              )}
            >
              <Sparkles size={isCompact ? 8 : 10} /> +{task.rewardXp}
            </span>
          )}
          {task.rewardGold !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-gold font-medium",
                isCompact ? "text-label-s" : "text-tiny",
              )}
            >
              <Coins size={isCompact ? 8 : 10} /> +{task.rewardGold}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
