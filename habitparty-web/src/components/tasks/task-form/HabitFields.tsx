"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { HABIT_RESET_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { ResetCounterOption } from "@/types/task";
import { cn } from "@/utils";

interface HabitFieldsProps {
  form: CreateTaskFormReturn;
}

export function HabitFields({ form }: HabitFieldsProps) {
  const { habitType, setHabitType, resetCounter, setResetCounter, isPending } =
    form;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* Tipo de Hábito (Positivo / Negativo / Ambos) */}
      <div className="flex flex-col gap-2">
        <span className="text-body-s text-neutral-300 font-medium">
          Direção do Hábito
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("POSITIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "POSITIVE"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
            )}
          >
            <Plus size={16} />
            <span>Positivo</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("NEGATIVE")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "NEGATIVE"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
            )}
          >
            <Minus size={16} />
            <span>Negativo</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setHabitType("BOTH")}
            className={cn(
              "flex items-center justify-center gap-1 py-2 px-2 rounded-lg border text-body-s font-bold transition-all cursor-pointer disabled:opacity-50",
              habitType === "BOTH"
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs"
                : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
            )}
          >
            <span>+/- Ambos</span>
          </button>
        </div>
      </div>

      {/* Contador / Reset */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="habitReset"
          className="text-body-s text-neutral-300 font-medium"
        >
          Reiniciar Contador (Reset)
        </label>
        <div className="relative">
          <select
            id="habitReset"
            value={resetCounter}
            disabled={isPending}
            onChange={(e) =>
              setResetCounter(e.target.value as ResetCounterOption)
            }
            className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
          >
            {HABIT_RESET_OPTIONS.map((opt) => (
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
