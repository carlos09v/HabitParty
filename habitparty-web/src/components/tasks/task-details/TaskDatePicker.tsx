import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import type { AppLocale } from "@/i18n/config";
import { getPopoverDueDateInfo } from "@/utils/date";

interface TaskDatePickerProps {
  dueDate: string;
  onDateChange: (newDate: string) => void;
  disabled?: boolean;
}

/**
 * Seletor rápido de data para o cabeçalho de detalhes de tarefas To-Do.
 * Injeta as regras de domínio de prazo/atraso de tarefas sobre o DatePicker universal (variante "badge").
 */
export function TaskDatePicker({
  dueDate,
  onDateChange,
  disabled = false,
}: TaskDatePickerProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const locale = useLocale() as AppLocale;
  const dateInfo = useMemo(
    () => getPopoverDueDateInfo(dueDate, locale),
    [dueDate, locale],
  );

  return (
    <div title={disabled ? t("dateFrozenTitle") : undefined}>
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
    </div>
  );
}
