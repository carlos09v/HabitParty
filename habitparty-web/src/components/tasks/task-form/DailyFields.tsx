"use client";

import { ChevronDown } from "lucide-react";
import { DAILY_REPEAT_OPTIONS, DAYS_OF_WEEK_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { DailyRepeatTypeOption } from "@/types/task";
import { cn } from "@/utils";

interface DailyFieldsProps {
  form: CreateTaskFormReturn;
}

export function DailyFields({ form }: DailyFieldsProps) {
  const {
    startDate,
    setStartDate,
    repeatType,
    setRepeatType,
    repeatEvery,
    setRepeatEvery,
    selectedDays,
    toggleDayOfWeek,
    isPending,
  } = form;

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Data Inicial */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="dailyStart"
          className="text-body-s text-neutral-300 font-medium"
        >
          Data Inicial
        </label>
        <input
          id="dailyStart"
          type="date"
          value={startDate}
          disabled={isPending}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s [color-scheme:dark] cursor-pointer"
        />
      </div>

      {/* Repetição & Intervalo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="dailyRepeat"
            className="text-body-s text-neutral-300 font-medium"
          >
            Repetição
          </label>
          <div className="relative">
            <select
              id="dailyRepeat"
              value={repeatType}
              disabled={isPending}
              onChange={(e) =>
                setRepeatType(e.target.value as DailyRepeatTypeOption)
              }
              className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
            >
              {DAILY_REPEAT_OPTIONS.map((opt) => (
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="dailyInterval"
            className="text-body-s text-neutral-300 font-medium"
          >
            A cada (dias)
          </label>
          <input
            id="dailyInterval"
            type="number"
            min={1}
            max={365}
            value={repeatEvery}
            disabled={isPending}
            onChange={(e) =>
              setRepeatEvery(Math.max(1, Number(e.target.value)))
            }
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s font-bold"
          />
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="flex flex-col gap-1.5">
        <span className="text-body-s text-neutral-300 font-medium">
          Dias da semana
        </span>
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK_OPTIONS.map((day) => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                disabled={isPending}
                onClick={() => toggleDayOfWeek(day.id)}
                className={cn(
                  "py-1.5 px-0.5 rounded-lg border text-tiny font-bold transition-all cursor-pointer disabled:opacity-50 text-center flex items-center justify-center",
                  isSelected
                    ? "border-gold bg-gold text-neutral-900 shadow-glow-gold-xs font-black"
                    : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
