"use client";

import { Calendar, Lock, Repeat, Target } from "lucide-react";
import type { TaskTypeOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskTypeTabsProps {
  taskType: TaskTypeOption;
  onChange: (type: TaskTypeOption) => void;
  disabled?: boolean;
  isEditing?: boolean;
}

export function TaskTypeTabs({
  taskType,
  onChange,
  disabled = false,
  isEditing = false,
}: TaskTypeTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 p-1 bg-surface/60 border border-primary/25 rounded-xl">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("HABIT")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "HABIT"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-neutral-300 hover:text-gold hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "HABIT" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Repeat size={16} />
        )}
        <span>Hábito</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("DAILY")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "DAILY"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-neutral-300 hover:text-gold hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "DAILY" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Calendar size={16} />
        )}
        <span>Diária</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("TODO")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "TODO"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-neutral-300 hover:text-gold hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "TODO" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Target size={16} />
        )}
        <span>Afazer (ToDo)</span>
      </button>
    </div>
  );
}
