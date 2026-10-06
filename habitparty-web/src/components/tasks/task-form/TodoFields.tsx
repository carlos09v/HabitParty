"use client";

import { ChevronDown } from "lucide-react";
import { TODO_REMINDER_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { ReminderTypeOption } from "@/types/task";

interface TodoFieldsProps {
  form: CreateTaskFormReturn;
}

export function TodoFields({ form }: TodoFieldsProps) {
  const { dueDate, setDueDate, reminderType, setReminderType, isPending } =
    form;

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Prazo */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="todoDue"
          className="text-body-s text-neutral-300 font-medium"
        >
          Prazo de Entrega
        </label>
        <input
          id="todoDue"
          type="date"
          value={dueDate}
          disabled={isPending}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s [color-scheme:dark] cursor-pointer"
        />
      </div>

      {/* Lembrete */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="todoReminder"
          className="text-body-s text-neutral-300 font-medium"
        >
          Lembrete
        </label>
        <div className="relative">
          <select
            id="todoReminder"
            value={reminderType}
            disabled={isPending}
            onChange={(e) =>
              setReminderType(e.target.value as ReminderTypeOption)
            }
            className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
          >
            {TODO_REMINDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#1a0f35]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
          />
        </div>
      </div>
    </div>
  );
}
