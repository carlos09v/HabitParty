import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AppLocale } from "@/i18n/config";
import { getPopoverDueDateInfo } from "@/utils/date";

interface TaskDatePickerProps {
  dueDate: string;
  dueTime?: string;
  onDateChange: (newDate: string) => void;
  onTimeChange?: (newTime: string) => void;
  disabled?: boolean;
}

/**
 * Seletor rápido de data e hora para o cabeçalho de detalhes de tarefas To-Do.
 * Injeta as regras de domínio de prazo/atraso de tarefas sobre o DatePicker/TimePicker universal (variante "badge").
 */
export function TaskDatePicker({
  dueDate,
  dueTime,
  onDateChange,
  onTimeChange,
  disabled = false,
}: TaskDatePickerProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const dateInfo = useMemo(
    () => getPopoverDueDateInfo(dueDate, locale, dueTime, dateFormat),
    [dueDate, locale, dueTime, dateFormat],
  );

  return (
    <div
      className="inline-flex items-center gap-1 flex-wrap"
      title={disabled ? t("dateFrozenTitle") : undefined}
    >
      <DatePicker
        value={dueDate}
        onChange={onDateChange}
        variant="badge"
        badgeLabel={dateInfo.label}
        isOverdue={dateInfo.isOverdue}
        clearLabel={t("noDueDate")}
        allowClear={!disabled}
        disabled={disabled}
      />
      {onTimeChange && (
        <TimePicker
          value={dueTime || ""}
          onChange={onTimeChange}
          variant="badge"
          badgeLabel={t("dueTimeBadge")}
          clearLabel={t("clearDueTime")}
          isOverdue={dateInfo.isOverdue}
          allowClear={!disabled}
          disabled={disabled}
        />
      )}
    </div>
  );
}
