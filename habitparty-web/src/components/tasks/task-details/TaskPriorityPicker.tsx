"use client";

import { Check, Flag } from "lucide-react";
import { useRef, useState } from "react";
import { TASK_PRIORITY_META, TODO_PRIORITY_OPTIONS } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskPriorityPickerProps {
  priority: string;
  onPrioritySelect: (p: TaskPriorityOption) => void;
}

export function TaskPriorityPicker({
  priority,
  onPrioritySelect,
}: TaskPriorityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), { enabled: isOpen });

  const priorityMeta =
    TASK_PRIORITY_META[priority] || TASK_PRIORITY_META.MEDIUM;

  const handleSelect = (p: TaskPriorityOption) => {
    onPrioritySelect(p);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "p-1.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105",
          priorityMeta.badgeColor,
        )}
        title={`Prioridade: ${priorityMeta.label} (clique para alterar)`}
      >
        <Flag size={13} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-popover border border-primary/40 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-32 animate-in fade-in duration-100">
          <span className="text-tiny uppercase font-bold text-neutral-400 px-2 py-0.5">
            Prioridade
          </span>
          {TODO_PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={cn(
                "flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left",
                priority === opt.id
                  ? "bg-white/15 font-bold text-neutral-50"
                  : "text-neutral-300 hover:bg-white/8 hover:text-neutral-100",
              )}
            >
              <span>{opt.label}</span>
              {priority === opt.id && <Check size={11} className="text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
