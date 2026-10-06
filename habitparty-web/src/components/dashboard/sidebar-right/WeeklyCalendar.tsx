"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";

const DEFAULT_DAYS: DayItem[] = [
  { shortName: "Seg", dayNumber: 17, hasActivity: false },
  { shortName: "Ter", dayNumber: 18, hasActivity: true },
  { shortName: "Qua", dayNumber: 19, hasActivity: true },
  { shortName: "Qui", dayNumber: 20, hasActivity: false },
  { shortName: "Sex", dayNumber: 21, hasActivity: true },
  { shortName: "Sab", dayNumber: 22, hasActivity: false },
  { shortName: "Dom", dayNumber: 23, hasActivity: false },
];

import { useCompactMode } from "@/hooks/useCompactMode";
import type { DayItem } from "@/types/dashboard";

export function WeeklyCalendar() {
  const { isCompact } = useCompactMode();
  const [selectedDay, setSelectedDay] = useState(19);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header do Widget */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          Histórico:
        </h4>

        {/* Dropdown de parâmetro */}
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md bg-white/8 border border-white/15 text-neutral-100 hover:bg-white/12 transition-colors",
            isCompact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-body-s",
          )}
        >
          <CalendarIcon size={14} className="text-neutral-300" />
          <span className="text-xs">Dia específico</span>
          <ChevronsUpDown size={12} className="text-neutral-400" />
        </button>
      </div>

      {/* Navegador Semanal */}
      <div className="flex items-center justify-between gap-1 w-full">
        <button
          type="button"
          className="p-1 rounded hover:bg-white/8 text-neutral-400 hover:text-neutral-100 transition-colors"
          title="Semana anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-between">
          {DEFAULT_DAYS.map((day) => {
            const isSelected = selectedDay === day.dayNumber;
            return (
              <button
                key={day.shortName}
                type="button"
                onClick={() => setSelectedDay(day.dayNumber)}
                className={cn(
                  "flex flex-col items-center justify-between rounded-lg transition-all flex-1 min-w-0",
                  isCompact ? "h-11 py-1 px-0.5" : "h-14 py-1.5 px-1",
                  isSelected
                    ? "bg-gold text-neutral-900 font-bold shadow-md"
                    : "text-neutral-100 hover:bg-white/6 border border-transparent hover:border-white/10",
                )}
              >
                <span
                  className={cn(
                    "text-label-g font-medium leading-none",
                    isSelected
                      ? "text-neutral-900 font-semibold"
                      : "text-neutral-400",
                  )}
                >
                  {day.shortName}
                </span>

                <span
                  className={cn(
                    "font-bold leading-none my-auto",
                    isCompact ? "text-sm" : "text-body-m",
                    isSelected ? "text-neutral-900" : "text-neutral-100",
                  )}
                >
                  {day.dayNumber}
                </span>

                {/* Marcador de meta atingida (bolinha rosa/magenta permanece mesmo se selecionado) */}
                <div className="h-2 flex items-center justify-center">
                  {day.hasActivity ? (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full bg-magenta",
                        isSelected
                          ? "shadow-[0_0_4px_rgba(237,43,229,0.9)]"
                          : "shadow-[0_0_6px_rgba(237,43,229,0.6)]",
                      )}
                    />
                  ) : (
                    <span className="w-1.5 h-1.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="p-1 rounded hover:bg-white/8 text-neutral-400 hover:text-neutral-100 transition-colors"
          title="Próxima semana"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
