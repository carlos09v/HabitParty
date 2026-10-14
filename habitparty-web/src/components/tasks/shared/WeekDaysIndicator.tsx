import { WEEK_DAYS } from "@/constants/task";
import type { DailyDaysOfWeek } from "@/types/task";
import { cn } from "@/utils";

interface WeekDaysIndicatorProps {
  daysOfWeek?: DailyDaysOfWeek[] | null;
  isCompact?: boolean;
  className?: string;
}

/**
 * Indicador visual circular dos 7 dias da semana para tarefas Diárias.
 * Compartilhado entre o Kanban de Tasks e a Tabela do Dashboard.
 */
export function WeekDaysIndicator({
  daysOfWeek,
  isCompact = false,
  className,
}: WeekDaysIndicatorProps) {
  // Se daysOfWeek tiver itens, acende apenas os selecionados. Se for nulo/vazio em Diária, acende todos os dias.
  const hasSelectedDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0;
  const todayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      title="Dias ativos da semana"
    >
      {WEEK_DAYS.map((day, index) => {
        const isActive = !hasSelectedDays || daysOfWeek.includes(day.enumValue);
        const isToday = index === todayIndex;

        return (
          <span
            key={day.enumValue}
            title={`${day.fullName}${isToday ? " (Hoje)" : ""}: ${isActive ? "Ativo" : "Inativo"}`}
            className={cn(
              "rounded-full flex items-center justify-center font-bold transition-all",
              isCompact ? "w-4 h-4 text-[8px]" : "w-4.5 h-4.5 text-[9px]",
              isActive &&
                isToday &&
                "bg-magenta text-white shadow-glow-magenta font-extrabold ring-1 ring-white/40",
              isActive &&
                !isToday &&
                "bg-gold text-neutral-900 shadow-glow-gold-xs font-extrabold",
              !isActive &&
                isToday &&
                "border border-magenta/70 text-magenta font-bold bg-magenta/10",
              !isActive &&
                !isToday &&
                "bg-white/5 text-neutral-500 border border-white/5",
            )}
          >
            {day.shortLabel}
          </span>
        );
      })}
    </div>
  );
}
