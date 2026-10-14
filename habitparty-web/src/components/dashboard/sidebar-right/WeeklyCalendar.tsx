"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

type PeriodOption = "specific_day" | "today" | "this_week" | "this_month";

const PERIOD_OPTIONS: readonly { id: PeriodOption; label: string }[] = [
  { id: "specific_day", label: "Dia específico" },
  { id: "today", label: "Hoje" },
  { id: "this_week", label: "Esta semana" },
  { id: "this_month", label: "Este mês" },
] as const;

const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

interface WeeklyCalendarProps {
  isCompact?: boolean;
  transactions?: TransactionHistoryResponseDTO[];
  tasks?: Task[];
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
}: WeeklyCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const urlDate = searchParams.get("date");
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodOption>("specific_day");
  const [weekOffset, setWeekOffset] = useState(0);

  // Inicializa data de hoje (YYYY-MM-DD)
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

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
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);

    // Encontra a Segunda-feira da semana (0 = Segunda, 6 = Domingo)
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const shortNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    return shortNames.map((shortName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const isoString = `${y}-${m}-${dayNum}`;

      const dayName = WEEKDAY_NAMES[d.getDay()];

      // Contagem de tarefas programadas para este dia
      const scheduledTasksCount = tasks.filter((t) => {
        if (t.dueDate === isoString) return true;
        const type = (t.type || "").toLowerCase();
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
    setSelectedPeriod(period);
    const params = new URLSearchParams(searchParams.toString());
    if (period === "today") {
      params.delete("date");
      params.set("filter", "today");
    } else if (period === "this_week") {
      params.delete("date");
      params.set("filter", "next7days");
    } else if (period === "specific_day") {
      // Retorna para visualização de dia específico
      params.delete("filter");
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
  };

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((p) => p.id === selectedPeriod)?.label ||
    "Dia específico";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header do Widget com Dropdown de Período */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          Histórico:
        </h4>

        {/* Dropdown de Parâmetro */}
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-2 text-neutral-300">
            <CalendarIcon size={13} aria-hidden="true" />
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodOption)}
            aria-label="Selecionar período do histórico"
            className={cn(
              "appearance-none pl-6 pr-6 rounded-md bg-white/10 border border-white/15 text-neutral-100 font-medium hover:bg-white/15 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer transition-colors text-xs",
              isCompact ? "py-1" : "py-1.5",
            )}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option
                key={opt.id}
                value={opt.id}
                className="bg-neutral-900 text-neutral-100"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-1.5 text-neutral-400">
            <ChevronsUpDown size={12} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Navegador Semanal Dinâmico: só aparece e fica ativo se 'Dia específico' estiver selecionado */}
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

                  {/* Marcador de meta/atividade atingida (bolinha rosa/magenta) */}
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
        /* Estado desabilitado / sumido quando outro período é selecionado */
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-neutral-400 text-tiny text-center transition-all",
            isCompact ? "py-2 px-2" : "py-3 px-3",
          )}
        >
          <span>
            Exibindo histórico para:{" "}
            <strong className="text-gold font-semibold">
              {selectedPeriodLabel}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
