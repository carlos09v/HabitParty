"use client";

import { Calendar, Repeat, Target } from "lucide-react";
import type { TaskTypeOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskTypeTabsProps {
  taskType: TaskTypeOption;
  onChange: (type: TaskTypeOption) => void;
  disabled?: boolean;
}

export function TaskTypeTabs({
  taskType,
  onChange,
  disabled = false,
}: TaskTypeTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 p-1 bg-primary-dark/30 border border-primary/30 rounded-xl">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("HABIT")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50",
          taskType === "HABIT"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-white hover:text-gold hover:bg-white/5",
        )}
      >
        <Repeat size={16} />
        <span>Hábito</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("DAILY")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50",
          taskType === "DAILY"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-white hover:text-gold hover:bg-white/5",
        )}
      >
        <Calendar size={16} />
        <span>Diária</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("TODO")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50",
          taskType === "TODO"
            ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs border"
            : "text-white hover:text-gold hover:bg-white/5",
        )}
      >
        <Target size={16} />
        <span>Afazer (ToDo)</span>
      </button>
    </div>
  );
}
