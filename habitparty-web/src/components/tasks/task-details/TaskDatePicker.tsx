"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { DatePickerEventSchedulePatch } from "@/types/ui";
import { getPopoverDueDateInfo } from "@/utils/date";

interface TaskDatePickerProps {
  dueDate: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
  onDateChange: (newDate: string) => void;
  onEventScheduleChange?: (patch: DatePickerEventSchedulePatch) => void;
  disabled?: boolean;
}

/**
 * Seletor rápido de data e horário integrado para o cabeçalho de detalhes de tarefas To-Do.
 * Injeta as regras de domínio de prazo/atraso de tarefas sobre o DatePicker universal (variante "badge" com enableTime).
 */
export function TaskDatePicker({
  dueDate,
  dueTime,
  startTime,
  dueEndTime,
  isAllDay,
  onDateChange,
  onEventScheduleChange,
  disabled = false,
}: TaskDatePickerProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const dateInfo = useMemo(
    () =>
      getPopoverDueDateInfo(
        dueDate,
        locale,
        dueTime,
        dateFormat,
        dueEndTime,
        startTime,
        isAllDay,
        timeFormat,
        userTimeZone,
      ),
    [
      dueDate,
      locale,
      dueTime,
      dateFormat,
      dueEndTime,
      startTime,
      isAllDay,
      timeFormat,
      userTimeZone,
    ],
  );

  return (
    <div
      className="inline-flex items-center gap-1 min-w-0"
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
        enableTime={Boolean(onEventScheduleChange)}
        timeValue={dueTime}
        startTimeValue={startTime}
        endTimeValue={dueEndTime}
        allDayValue={isAllDay}
        onEventScheduleChange={onEventScheduleChange}
      />
    </div>
  );
}
