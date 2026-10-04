"use client";

import { useState } from "react";
import { Check, Coins, Flame, Minus, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import { type Task, type TaskDifficulty } from "@/types/task";
import { cn } from "@/utils";
import { useTaskProgress } from "@/hooks/useTaskProgress";

interface TaskRowProps {
  task: Task;
  onToggle?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
}

const DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  trivial: "border-l-info hover:border-l-info-hover",
  low: "border-l-success-500 hover:border-l-success-hover",
  normal: "border-l-warning-500 hover:border-l-warning-hover",
  high: "border-l-danger-500 hover:border-l-danger-hover",
};

const TYPE_LABELS: Record<Task["type"], { label: string; color: string }> = {
  habit: {
    label: "Hábito",
    color: "text-info bg-info/15 border-info/40",
  },
  daily: {
    label: "Diária",
    color: "text-magenta bg-magenta/15 border-magenta/40",
  },
  todo: {
    label: "Afazer",
    color: "text-gold bg-gold/15 border-gold/40",
  },
};

const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export function TaskRow({ task, onToggle, onHabitChange }: TaskRowProps) {
  const { completed, habitScore, toggleCompleted, changeHabit, isDone } = useTaskProgress(task, {
    onToggle,
    onHabitChange,
  });

  const typeInfo = TYPE_LABELS[task.type];

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_40px] items-center gap-4 px-4 py-3 rounded-xl border transition-all",
        "bg-primary-dark/20 border border-primary/30 hover:border-y-primary-light/40 hover:border-r-primary-light/40 hover:bg-primary-dark/30",
        DIFFICULTY_COLORS[task.difficulty ?? "normal"],
        "border-l-[4px]",
        isDone && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {task.type === "habit" ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => changeHabit(1)}
              title="Registrar hábito positivo (+)"
              className="w-6 h-6 rounded-md bg-success-500/20 border border-success-500/40 text-success-500 hover:bg-success-500 hover:text-neutral-900 flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={14} className="stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => changeHabit(-1)}
              title="Registrar hábito negativo (-)"
              className="w-6 h-6 rounded-md bg-danger-500/20 border border-danger-500/40 text-danger-500 hover:bg-danger-500 hover:text-neutral-100 flex items-center justify-center font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Minus size={14} className="stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleCompleted}
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
              completed
                ? "bg-gold border-gold text-neutral-900 shadow-[0_0_8px_rgba(237,229,57,0.4)]"
                : "border-primary/50 bg-primary-dark/40 hover:border-gold",
            )}
          >
            {completed && <Check size={14} className="stroke-[3]" />}
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-body-s font-semibold text-neutral-50 truncate",
              isDone && "line-through text-neutral-400",
            )}
          >
            {task.title}
          </span>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            {task.type !== "todo" && task.streak !== undefined && (
              <>
                <span className="flex items-center gap-0.5 text-warning-500 font-bold">
                  <Flame size={12} className="fill-warning-500 text-warning-500" />
                  {task.streak}
                </span>
                <span>•</span>
              </>
            )}

            <span className="flex items-center gap-0.5 text-magenta font-medium">
              <Sparkles size={11} /> +{task.rewardXp} XP
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-gold font-medium">
              <Coins size={11} /> +{task.rewardGold}
            </span>

            {task.type === "habit" && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    "font-bold text-[10px] px-1.5 py-0.5 rounded",
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

      <div className="flex items-center">
        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/[0.06] border border-white/[0.1] text-neutral-200 truncate">
          {task.category}
        </span>
      </div>

      <div className="flex items-center">
        <span
          className={cn(
            "px-2 py-0.5 rounded-md text-[11px] font-bold border truncate shadow-xs",
            typeInfo.color,
          )}
        >
          {typeInfo.label}
        </span>
      </div>

      <div className="flex items-center min-w-0">
        {task.type !== "todo" && task.daysOfWeek ? (
          <div className="flex items-center gap-1">
            {DAYS_SHORT.map((dayLabel, idx) => {
              const isActive = task.daysOfWeek?.includes(idx);
              return (
                <span
                  key={idx}
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                    isActive
                      ? "bg-gold text-neutral-900 shadow-xs"
                      : "bg-white/[0.04] text-neutral-500",
                  )}
                >
                  {dayLabel}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-body-s text-neutral-300 font-medium truncate">
            {task.dueDate || "Sem prazo"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.08] transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
