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
              "rounded-full flex items-center justify-center font-bold transition-colors shrink-0",
              isCompact ? "w-3.5 h-3.5 text-[8px]" : "w-4.5 h-4.5 text-label-m",
              isActive &&
                isToday &&
                "bg-primary dark:bg-magenta text-white ring-2 ring-primary/25 dark:ring-1 dark:ring-white/40 dark:shadow-glow-magenta font-extrabold",
              isActive &&
                !isToday &&
                "bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-gold dark:text-on-gold dark:border-transparent dark:shadow-glow-gold-xs font-extrabold",
              !isActive &&
                isToday &&
                "border border-primary/70 dark:border-magenta/70 text-primary dark:text-magenta font-bold bg-primary/10 dark:bg-magenta/10",
              !isActive &&
                !isToday &&
                "bg-neutral-800 text-neutral-400 border border-neutral-700/60 dark:bg-white/5 dark:text-neutral-500 dark:border-white/5",
            )}
          >
            {shortLabel}
          </span>
        );
      })}
    </div>
  );
}
