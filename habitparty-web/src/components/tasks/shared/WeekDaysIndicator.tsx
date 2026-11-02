import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.taskShared.weekDays");
  // Se daysOfWeek tiver itens, acende apenas os selecionados. Se for nulo/vazio em Diária, acende todos os dias.
  const hasSelectedDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0;
  const todayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      title={t("activeDaysTitle")}
    >
      {WEEK_DAYS.map((day, index) => {
        const isActive = !hasSelectedDays || daysOfWeek.includes(day.enumValue);
        const isToday = index === todayIndex;
        const fullName = t(`${day.enumValue}.full`);
        const shortLabel = t(`${day.enumValue}.short`);

        return (
          <span
            key={day.enumValue}
            title={`${fullName}${isToday ? t("todaySuffix") : ""}: ${isActive ? t("activeStatus") : t("inactiveStatus")}`}
            className={cn(
              "rounded-full flex items-center justify-center font-bold transition-all shrink-0",
              isCompact ? "w-3.5 h-3.5 text-[8px]" : "w-4.5 h-4.5 text-label-m",
              isActive &&
                isToday &&
                "bg-magenta text-white shadow-glow-magenta font-extrabold ring-1 ring-white/40",
              isActive &&
                !isToday &&
                "bg-gold text-on-gold shadow-glow-gold-xs font-extrabold",
              !isActive &&
                isToday &&
                "border border-magenta/70 text-magenta font-bold bg-magenta/10",
              !isActive &&
                !isToday &&
                "bg-white/5 text-neutral-500 border border-white/5",
            )}
          >
            {shortLabel}
          </span>
        );
      })}
    </div>
  );
}
