"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { PERIOD_OPTIONS, type PeriodOption } from "@/constants/dashboard";
import { ALL_WEEK_DAYS, normalizeTaskType } from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import { getTodayDateString } from "@/utils/dashboardMetrics";
import { getWeekDateRange } from "@/utils/date";

interface WeeklyCalendarProps {
  isCompact?: boolean;
  transactions?: TransactionHistoryResponseDTO[];
  tasks?: Task[];
  onSelectDay?: (isoString: string) => void;
}

/**
 * Calendário Semanal Interativo do Dashboard.
 * Client Component (Leaf Node): calcula dinamicamente os dias da semana corrente
 * relativo ao fuso do usuário, detecta tarefas e histórico com bolinha magenta e tooltip explicativo,
 * e sincroniza o dia clicado com a URL para filtrar as tarefas na tela principal.
 */
export function WeeklyCalendar({
  isCompact: propIsCompact,
  transactions = [],
  tasks = [],
  onSelectDay,
}: WeeklyCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const urlDate = searchParams.get("date");
  const urlFilter = searchParams.get("filter");

  const selectedPeriod: PeriodOption = useMemo(() => {
    if (urlDate) return "specific_day";
    if (urlFilter === "this_month") return "this_month";
    if (urlFilter === "next7days") return "this_week";
    if (urlFilter === "today") return "today";
    return "specific_day";
  }, [urlDate, urlFilter]);

  const [weekOffset, setWeekOffset] = useState(0);

  // Inicializa data de hoje (YYYY-MM-DD)
  const todayIso = useMemo(() => getTodayDateString(), []);

  const activeSelectedDate = urlDate || todayIso;

  // Datas com transações registradas no histórico
  const activityDates = useMemo(() => {
    const dates = new Set<string>();
    for (const tx of transactions) {
      if (tx.createdAt) {
        dates.add(tx.createdAt.split("T")[0]);
      }
    }
    return dates;
  }, [transactions]);

  // Calcula dinamicamente os 7 dias da semana (Segunda a Domingo) baseado no weekOffset
  const weekDays = useMemo(() => {
    const { monday } = getWeekDateRange(new Date(), weekOffset);
    const shortNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    return shortNames.map((shortName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const isoString = `${y}-${m}-${dayNum}`;

      const dayName = ALL_WEEK_DAYS[d.getDay()];

      // Contagem de tarefas programadas para este dia
      const scheduledTasksCount = tasks.filter((t) => {
        if (t.dueDate === isoString) return true;
        const type = normalizeTaskType(t);
        if (type === "daily") {
          return (
            !t.daysOfWeek ||
            t.daysOfWeek.length === 0 ||
            t.daysOfWeek.includes(dayName)
          );
        }
        return false;
      }).length;

      const hasTransaction = activityDates.has(isoString);
      const hasActivity = scheduledTasksCount > 0 || hasTransaction;

      let tooltipText = `${shortName}, dia ${d.getDate()}${isoString === todayIso ? " (Hoje)" : ""}`;
      if (scheduledTasksCount > 0 && hasTransaction) {
        tooltipText += ` • ${scheduledTasksCount} ${scheduledTasksCount === 1 ? "tarefa agendada" : "tarefas agendadas"} e atividades concluídas`;
      } else if (scheduledTasksCount > 0) {
        tooltipText += ` • ${scheduledTasksCount} ${scheduledTasksCount === 1 ? "tarefa agendada" : "tarefas agendadas"}`;
      } else if (hasTransaction) {
        tooltipText += " • Atividades concluídas";
      }

      return {
        shortName,
        dayNumber: d.getDate(),
        isoString,
        isToday: isoString === todayIso,
        hasActivity,
        tooltipText,
      };
    });
  }, [weekOffset, activityDates, tasks, todayIso]);

  const handlePeriodChange = (period: PeriodOption) => {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "today") {
      params.delete("date");
      params.set("filter", "today");
    } else if (period === "this_week") {
      params.delete("date");
      params.set("filter", "next7days");
    } else if (period === "this_month") {
      params.delete("date");
      params.set("filter", "this_month");
    } else if (period === "specific_day") {
      params.delete("filter");
      params.set("date", todayIso);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleDayClick = (isoString: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("date") === isoString) {
      params.delete("date");
    } else {
      params.set("date", isoString);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
    onSelectDay?.(isoString);
  };

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((p) => p.id === selectedPeriod)?.label ||
    "Dia específico";

  const periodOptions = useMemo(
    () =>
      PERIOD_OPTIONS.map((opt) => ({
        value: opt.id,
        label: opt.label,
      })),
    [],
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header do Widget com Dropdown de Período */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          Calendário:
        </h4>

        {/* Dropdown de Parâmetro Customizado */}
        <Select
          variant="inline"
          align="right"
          icon={<CalendarIcon size={12} className="text-gold shrink-0" />}
          value={selectedPeriod}
          onChange={(val) => handlePeriodChange(val as PeriodOption)}
          options={periodOptions}
          aria-label="Selecionar período do histórico"
          dropdownClassName="min-w-[140px]"
          className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-md px-1.5 py-0.5"
        />
      </div>

      {/* Navegador Semanal Dinâmico */}
      {selectedPeriod === "specific_day" ? (
        <div className="flex items-center justify-between gap-1 w-full transition-all">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-between">
            {weekDays.map((day) => {
              const isSelected = activeSelectedDate === day.isoString;
              return (
                <button
                  key={day.isoString}
                  type="button"
                  onClick={() => handleDayClick(day.isoString)}
                  aria-pressed={isSelected}
                  title={day.tooltipText}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-lg transition-all flex-1 min-w-0 cursor-pointer relative group/day",
                    isCompact ? "h-11 py-1 px-0.5" : "h-14 py-1.5 px-1",
                    isSelected
                      ? "bg-gold text-neutral-900 font-bold shadow-md"
                      : day.isToday
                        ? "border border-gold/50 text-gold hover:bg-gold/10"
                        : "text-neutral-100 hover:bg-white/5 border border-transparent hover:border-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "text-label-g font-medium leading-none",
                      isSelected
                        ? "text-neutral-900 font-semibold"
                        : day.isToday
                          ? "text-gold font-semibold"
                          : "text-neutral-400",
                    )}
                  >
                    {day.shortName}
                  </span>

                  <span
                    className={cn(
                      "font-bold leading-none my-auto",
                      isCompact ? "text-sm" : "text-body-m",
                      isSelected
                        ? "text-neutral-900"
                        : day.isToday
                          ? "text-gold"
                          : "text-neutral-100",
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Marcador de meta/atividade atingida */}
                  <div className="h-2 flex items-center justify-center">
                    {day.hasActivity ? (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full bg-magenta transition-transform",
                          isSelected
                            ? "shadow-[0_0_6px_var(--color-magenta)]"
                            : "opacity-90 group-hover/day:scale-125",
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
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            title="Próxima semana"
            aria-label="Próxima semana"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        /* Estado desabilitado quando outro período é selecionado */
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border border-dashed border-white/10 bg-white/5 text-neutral-400 text-tiny transition-all",
            isCompact ? "py-2 px-2.5" : "py-3 px-3",
          )}
        >
          <span>
            Exibindo tarefas:{" "}
            <strong className="text-gold font-semibold">
              {selectedPeriodLabel}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => handlePeriodChange("specific_day")}
            className="text-xs text-gold hover:text-gold-light underline font-medium cursor-pointer shrink-0"
          >
            Ver semana
          </button>
        </div>
      )}
    </div>
  );
}
