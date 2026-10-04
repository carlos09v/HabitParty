"use client";

import { useState } from "react";
import {
  Check,
  Coins,
  Flame,
  Minus,
  Plus,
  Sparkles,
  FileText,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Task } from "@/types/task";
import { cn } from "@/utils";

interface RoutineTaskCardProps {
  task: Task;
  columnId: string;
  onToggleCompleted?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  isOverlay?: boolean;
}

const HABIT_BORDER: Record<string, string> = {
  low: "border-l-info hover:border-l-info-hover",
  normal: "border-l-success-500 hover:border-l-success-hover",
  high: "border-l-danger-500 hover:border-l-danger-hover",
};

const DIFFICULTY_BORDER: Record<string, string> = {
  trivial: "border-l-info hover:border-l-info-hover",
  low: "border-l-success-500 hover:border-l-success-hover",
  normal: "border-l-warning-500 hover:border-l-warning-hover",
  high: "border-l-danger-500 hover:border-l-danger-hover",
};

export function RoutineTaskCard({
  task,
  columnId,
  onToggleCompleted,
  onHabitChange,
  isOverlay = false,
}: RoutineTaskCardProps) {
  const [completed, setCompleted] = useState(task.completed);
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
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const borderClass =
    task.type === "habit"
      ? HABIT_BORDER[task.importance || "normal"]
      : DIFFICULTY_BORDER[task.difficulty || "normal"];

  const handleToggle = () => {
    const next = !completed;
    setCompleted(next);
    onToggleCompleted?.(task.id, next);
  };

  const handleDelta = (delta: number) => {
    setScore((prev) => prev + delta);
    onHabitChange?.(task.id, delta);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group/card flex flex-col gap-2.5 p-3 rounded-xl border border-l-4 transition-all select-none touch-none",
        "bg-primary-dark/20 border-primary/30 hover:bg-primary-dark/35",
        "hover:border-y-primary-light/40 hover:border-r-primary-light/40",
        borderClass,
        completed && task.type !== "habit" && "opacity-60",
        isDragging && "opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "shadow-[0_12px_24px_rgba(0,0,0,0.45)] border-gold/70 bg-primary-dark/60 scale-102 rotate-1 cursor-grabbing z-50",
      )}
    >
      {/* Topo: Tag de Categoria + Drag Grip */}
      <div className="flex items-center justify-between gap-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/6 border border-white/10 text-neutral-300 truncate">
          {task.category}
        </span>

        <div className="flex items-center gap-1">
          {task.description && (
            <span title="Possui descrição" className="text-neutral-400">
              <FileText size={12} />
            </span>
          )}
          <GripVertical
            size={14}
            className="text-neutral-500 group-hover/card:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>

      {/* Meio: Ação (Checkbox ou + / -) + Título */}
      <div className="flex items-start gap-2.5 min-w-0">
        {task.type === "habit" ? (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelta(1);
              }}
              title="Ação positiva (+)"
              className="w-5 h-5 rounded bg-success-500/20 border border-success-500/40 text-success-500 hover:bg-success-500 hover:text-neutral-900 flex items-center justify-center font-bold transition-all cursor-pointer text-[11px]"
            >
              <Plus size={12} className="stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelta(-1);
              }}
              title="Ação negativa (-)"
              className="w-5 h-5 rounded bg-danger-500/20 border border-danger-500/40 text-danger-500 hover:bg-danger-500 hover:text-neutral-100 flex items-center justify-center font-bold transition-all cursor-pointer text-[11px]"
            >
              <Minus size={12} className="stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className={cn(
              "w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5",
              completed
                ? "bg-gold border-gold text-neutral-900 shadow-[0_0_6px_rgba(237,229,57,0.4)]"
                : "border-primary/50 bg-primary-dark/40 hover:border-gold",
            )}
          >
            {completed && <Check size={12} className="stroke-[3]" />}
          </button>
        )}

        <span
          className={cn(
            "text-body-s font-semibold text-neutral-50 leading-snug line-clamp-2",
            completed &&
              task.type !== "habit" &&
              "line-through text-neutral-400",
          )}
        >
          {task.title}
        </span>
      </div>

      {/* Base: Streak (se houver), Recompensas e Saldo do Hábito */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/6">
        <div className="flex items-center gap-1.5">
          {task.type !== "todo" && task.streak !== undefined && (
            <span className="flex items-center gap-0.5 text-warning-500 font-bold">
              <Flame size={12} className="fill-warning-500 text-warning-500" />
              {task.streak}
            </span>
          )}

          {task.type === "habit" && (
            <span
              className={cn(
                "font-bold text-[10px] px-1 rounded",
                score >= 0
                  ? "text-success-500 bg-success-500/10"
                  : "text-danger-500 bg-danger-500/10",
              )}
            >
              {score > 0 ? `+${score}` : score}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-magenta font-medium">
            <Sparkles size={11} /> +{task.rewardXp}
          </span>
          <span className="flex items-center gap-0.5 text-gold font-medium">
            <Coins size={11} /> +{task.rewardGold}
          </span>
        </div>
      </div>
    </div>
  );
}
