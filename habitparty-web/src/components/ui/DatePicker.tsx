"use client";

import {
  CalendarClock,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { Select } from "@/components/ui/Select";
import { TimePicker, TimePickerBody } from "@/components/ui/TimePicker";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { isValidLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { DatePickerEventSchedulePatch, DatePickerProps } from "@/types/ui";
import { cn } from "@/utils";
import {
  formatDateParts,
  formatShortDate,
  formatTimeDisplay,
  formatTimeHHMM,
  generateCalendarGrid,
  getDatePartsInTimeZone,
  getFullMonths,
  getOffsetDateString,
  getShortWeekDays,
  minutesToTimeHHMM,
  parseDateParts,
  parseTimeToMinutes,
} from "@/utils/date";

const CALENDAR_POPOVER_WIDTH = 288;
const CALENDAR_POPOVER_ESTIMATED_HEIGHT = 315;
const CALENDAR_WITH_TIME_ESTIMATED_HEIGHT = 395;

const EVENT_DURATION_PRESETS = [
  { label: "+30m", minutes: 30 },
  { label: "+1h", minutes: 60 },
  { label: "+2h", minutes: 120 },
  { label: "+3h", minutes: 180 },
] as const;

/**
 * Seletor de data (DatePicker) universal do ecossistema HabitParty.
 * Renderiza o calendário via Portal (position: fixed) usando useFloatingPopover
 * para sobrepor modais, drawers e cards sem gerar barras de rolagem internas.
 */
export function DatePicker({
  id,
  label,
  value,
  defaultValue,
  onChange,
  name,
  required,
  variant = "input",
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  allowClear = true,
  clearLabel,
  badgeLabel,
  isOverdue = false,
  compact = false,
  className,
  error,
  hint,
  align = "left",
  yearRange,
  enableTime = false,
  timeValue,
  onTimeChange,
  startTimeValue,
  onStartTimeChange,
  endTimeValue,
  onEndTimeChange,
  allDayValue = false,
  onAllDayChange,
  onEventScheduleChange,
}: DatePickerProps) {
  const t = useTranslations("ui.datePicker");
  const rawLocale = useLocale();
  const locale = isValidLocale(rawLocale) ? rawLocale : "en";
  const { dateFormat } = useDateFormat();
  const resolvedPlaceholder = placeholder ?? t("placeholder");

  const monthOptions = useMemo(
    () =>
      getFullMonths(locale).map((m, idx) => ({
        value: String(idx),
        label: m,
      })),
    [locale],
  );
  const shortWeekDays = useMemo(() => getShortWeekDays(locale), [locale]);

  const generatedId = useId();
  const pickerId = id || generatedId;
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const selectedParts = useMemo(
    () => parseDateParts(currentValue),
    [currentValue],
  );

  const today = useMemo(() => {
    const now = new Date();
    const parts = getDatePartsInTimeZone(now, userTimeZone);
    return {
      year: parts.year,
      month: parts.month - 1,
      day: parts.day,
      isoString: formatDateParts(parts.year, parts.month - 1, parts.day),
      tomorrowIso: getOffsetDateString(1, now, userTimeZone),
    };
  }, [userTimeZone]);

  const resolveDefaultView = useCallback(() => {
    if (selectedParts) {
      return { year: selectedParts.year, month: selectedParts.month };
    }
    if (maxDate && maxDate < today.isoString) {
      const maxParts = parseDateParts(maxDate);
      if (maxParts) {
        return { year: maxParts.year, month: maxParts.month };
      }
    }
    return { year: today.year, month: today.month };
  }, [selectedParts, maxDate, today]);

  const [viewYear, setViewYear] = useState(() => resolveDefaultView().year);
  const [viewMonth, setViewMonth] = useState(() => resolveDefaultView().month);

  const syncViewToSelection = useCallback(() => {
    const next = resolveDefaultView();
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [resolveDefaultView]);

  const hasEventValue = Boolean(allDayValue || startTimeValue || endTimeValue);
  const { timeFormat } = useTimeFormat();
  const tTime = useTranslations("ui.timePicker");
  const isPremium = useUserStore((s) =>
    Boolean(s.user?.isPremium ?? s.is_Premium),
  );
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const hourTriggerId = `${pickerId}-hour-trigger`;
  const eventTriggerId = `${pickerId}-event-trigger`;

  const hourPopover = useFloatingPopover<
    HTMLDivElement,
    HTMLButtonElement,
    HTMLDivElement
  >({
    align: "left",
    estimatedHeight: 300,
    estimatedWidth: CALENDAR_POPOVER_WIDTH,
    matchTriggerWidth: true,
    maxAllowedHeight: 340,
    offset: 6,
    zIndex: 160,
  });

  const eventPopover = useFloatingPopover<
    HTMLDivElement,
    HTMLButtonElement,
    HTMLDivElement
  >({
    align: "left",
    estimatedHeight: 270,
    estimatedWidth: CALENDAR_POPOVER_WIDTH,
    matchTriggerWidth: true,
    maxAllowedHeight: 340,
    offset: 6,
    zIndex: 160,
  });

  const isSubOverlayOpen = hourPopover.isOpen || eventPopover.isOpen;

  useEffect(() => {
    if (!isSubOverlayOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        hourPopover.close();
        eventPopover.close();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isSubOverlayOpen, hourPopover.close, eventPopover.close]);

  const {
    containerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align,
    estimatedHeight: enableTime
      ? CALENDAR_WITH_TIME_ESTIMATED_HEIGHT
      : CALENDAR_POPOVER_ESTIMATED_HEIGHT,
    estimatedWidth: CALENDAR_POPOVER_WIDTH,
    matchTriggerWidth: false,
    offset: 6,
    disabled,
    onOpen: () => {
      hourPopover.close();
      eventPopover.close();
      syncViewToSelection();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      hourPopover.close();
      eventPopover.close();
    }
  }, [isOpen, hourPopover.close, eventPopover.close]);

  const updateValue = (nextVal: string) => {
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const applyEventSchedulePatch = (patch: DatePickerEventSchedulePatch) => {
    if (onEventScheduleChange) {
      onEventScheduleChange(patch);
      return;
    }
    if (patch.dueTime !== undefined) {
      onTimeChange?.(patch.dueTime);
    }
    if (patch.startTime !== undefined) {
      onStartTimeChange?.(patch.startTime);
    }
    if (patch.endTime !== undefined) {
      onEndTimeChange?.(patch.endTime);
    }
    if (patch.isAllDay !== undefined) {
      onAllDayChange?.(patch.isAllDay);
    }
  };

  const handleStepMonth = (delta: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    if (delta === -1 && viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else if (delta === 1 && viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + delta);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    updateValue(formatDateParts(year, month, day));
    if (isSubOverlayOpen) {
      return;
    }
    if (!enableTime || (!timeValue && !hasEventValue)) {
      close();
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateValue("");
    if (enableTime) {
      applyEventSchedulePatch({
        dueTime: "",
        startTime: "",
        endTime: "",
        isAllDay: false,
      });
      hourPopover.close();
      eventPopover.close();
    }
  };

  const handleSetQuickDate = (offsetDays: number) => {
    updateValue(
      getOffsetDateString(
        offsetDays,
        new Date(),
        useUserStore.getState().user?.timezone,
      ),
    );
    if (isSubOverlayOpen) {
      return;
    }
    if (!enableTime || (!timeValue && !hasEventValue)) {
      close();
    }
  };

  const handleSetNow = () => {
    applyEventSchedulePatch({
      dueTime: formatTimeHHMM(
        new Date(),
        useUserStore.getState().user?.timezone,
      ),
      startTime: "",
      endTime: "",
      isAllDay: false,
    });
  };

  const handleApplyDurationPreset = (minutesToAdd: number) => {
    const { hour: nowHour } = getDatePartsInTimeZone(
      new Date(),
      useUserStore.getState().user?.timezone,
    );
    const baseStart =
      startTimeValue || `${String((nowHour + 1) % 24).padStart(2, "0")}:00`;
    const startMin = parseTimeToMinutes(baseStart) ?? 0;
    const endMin = Math.min(1439, startMin + minutesToAdd);
    applyEventSchedulePatch({
      dueTime: "",
      startTime: baseStart,
      endTime: endMin > startMin ? minutesToTimeHHMM(endMin) : "",
      isAllDay: false,
    });
  };

  const calendarDays = useMemo(
    () =>
      generateCalendarGrid(viewYear, viewMonth, currentValue, {
        minDate,
        maxDate,
        timeZone: userTimeZone,
      }),
    [viewYear, viewMonth, currentValue, minDate, maxDate, userTimeZone],
  );

  const yearOptions = useMemo(() => {
    const currentYear = today.year;
    const max =
      yearRange?.max ??
      (maxDate
        ? (parseDateParts(maxDate)?.year ?? currentYear + 10)
        : currentYear + 10);
    const min =
      yearRange?.min ??
      (minDate
        ? (parseDateParts(minDate)?.year ?? currentYear - 100)
        : currentYear - 100);

    const list: { value: string; label: string }[] = [];
    for (let y = max; y >= min; y--) {
      const str = String(y);
      list.push({ value: str, label: str });
    }
    return list;
  }, [today.year, yearRange, maxDate, minDate]);

  const displayDateText = useMemo(() => {
    if (!currentValue) return null;
    if (currentValue === today.isoString) return t("today");
    if (currentValue === today.tomorrowIso) return t("tomorrow");
    return (
      formatShortDate(currentValue, {
        includeYear: true,
        locale,
        dateFormat,
        timeZone: userTimeZone,
      }) || currentValue
    );
  }, [
    currentValue,
    today.isoString,
    today.tomorrowIso,
    locale,
    dateFormat,
    userTimeZone,
    t,
  ]);

  const formattedTime = useMemo(
    () =>
      timeValue ? formatTimeDisplay(timeValue, { timeFormat, locale }) : null,
    [timeValue, timeFormat, locale],
  );
  const formattedStart = useMemo(
    () =>
      startTimeValue
        ? formatTimeDisplay(startTimeValue, { timeFormat, locale })
        : null,
    [startTimeValue, timeFormat, locale],
  );
  const formattedEnd = useMemo(
    () =>
      endTimeValue
        ? formatTimeDisplay(endTimeValue, { timeFormat, locale })
        : null,
    [endTimeValue, timeFormat, locale],
  );

  const displayFullText = useMemo(() => {
    let timeSuffix: string | null = null;
    if (allDayValue) {
      timeSuffix = t("allDayBadge");
    } else if (formattedStart && formattedEnd) {
      timeSuffix = `${formattedStart}–${formattedEnd}`;
    } else if (formattedStart) {
      timeSuffix = formattedStart;
    } else if (formattedTime) {
      timeSuffix = formattedEnd
        ? `${formattedTime}–${formattedEnd}`
        : formattedTime;
    }

    if (displayDateText && timeSuffix) {
      return `${displayDateText}, ${timeSuffix}`;
    }
    if (displayDateText) {
      return displayDateText;
    }
    if (timeSuffix) {
      return timeSuffix;
    }
    return null;
  }, [
    displayDateText,
    formattedTime,
    formattedStart,
    formattedEnd,
    allDayValue,
    t,
  ]);

  const resolvedClearLabel =
    clearLabel ?? (variant === "badge" ? t("noDueDate") : t("clear"));
  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const calendarPopover =
    isOpen && shouldRenderPortal && coords
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("dialogAriaLabel")}
            data-select-for={pickerId}
            style={floatingStyle}
            className={cn(
              "p-3 rounded-xl border border-primary/40 bg-popover shadow-2xl relative",
              "w-72 max-w-[calc(100vw-1rem)] animate-in fade-in zoom-in-95 duration-150 select-none",
              coords.placement === "top" ? "origin-bottom" : "origin-top",
            )}
          >
            {/* Header com Navegação Mensal e Seletores Rápidos de Mês/Ano */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 gap-1 relative z-20">
              <button
                type="button"
                onClick={(e) => handleStepMonth(-1, e)}
                className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label={t("prevMonth")}
                title={t("prevMonth")}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center justify-center gap-1 flex-1 min-w-0">
                <Select
                  variant="inline"
                  value={String(viewMonth)}
                  onChange={(val) => setViewMonth(Number(val))}
                  options={monthOptions}
                  dropdownClassName="min-w-[130px]"
                  aria-label={t("selectMonth")}
                />

                <Select
                  variant="inline"
                  value={String(viewYear)}
                  onChange={(val) => setViewYear(Number(val))}
                  options={yearOptions}
                  dropdownClassName="min-w-[90px]"
                  aria-label={t("selectYear")}
                />
              </div>

              <button
                type="button"
                onClick={(e) => handleStepMonth(1, e)}
                className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label={t("nextMonth")}
                title={t("nextMonth")}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {shortWeekDays.map((day) => (
                <span
                  key={day}
                  className="text-tiny font-semibold text-neutral-400 uppercase tracking-wider"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Grade dos Dias */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell) => (
                <button
                  key={cell.isoString}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() =>
                    handleSelectDay(cell.year, cell.month, cell.day)
                  }
                  className={cn(
                    "h-7 w-7 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-[color,background-color,border-color,opacity] duration-150 cursor-pointer relative",
                    !cell.isCurrentMonth &&
                      "text-neutral-500 opacity-40 hover:opacity-100",
                    cell.isCurrentMonth && "text-neutral-100",
                    cell.isToday &&
                      !cell.isSelected &&
                      "border border-gold/70 text-gold font-bold",
                    cell.isSelected
                      ? "bg-gold text-on-gold font-bold shadow-glow-gold-xs"
                      : "hover:bg-white/10 hover:text-gold",
                    cell.isDisabled &&
                      "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-neutral-500",
                  )}
                >
                  {cell.day}
                </button>
              ))}
            </div>

            {/* Gatilhos compactos de Horário e Evento (com cálculo inteligente de viewport via useFloatingPopover) */}
            {enableTime && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                {/* 1. Gatilho Hora */}
                <div
                  ref={hourPopover.containerRef}
                  id={hourTriggerId}
                  className="relative"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors",
                      hourPopover.isOpen
                        ? "border-gold/50 bg-gold/10"
                        : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (hourPopover.isOpen) {
                          hourPopover.close();
                          return;
                        }
                        eventPopover.close();
                        if (!currentValue) updateValue(today.isoString);
                        if (hasEventValue || !timeValue) {
                          const defaultHour = String(
                            (new Date().getHours() + 1) % 24,
                          ).padStart(2, "0");
                          applyEventSchedulePatch({
                            ...(hasEventValue
                              ? { startTime: "", endTime: "", isAllDay: false }
                              : {}),
                            ...(!timeValue
                              ? { dueTime: `${defaultHour}:00` }
                              : {}),
                          });
                        }
                        hourPopover.open();
                      }}
                      className="flex items-center justify-between flex-1 text-left text-label-g font-semibold text-neutral-200 hover:text-gold-ink dark:hover:text-gold transition-colors cursor-pointer min-w-0"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Clock size={12} className="text-gold shrink-0" />
                        <span>{t("timeLabel")}</span>
                        {formattedTime && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-gold-ink dark:bg-gold/15 dark:text-gold text-tiny font-bold tabular-nums">
                            {formattedTime}
                          </span>
                        )}
                      </span>
                      <span className="text-tiny text-neutral-400 font-normal">
                        {timeValue ? "" : t("addTimePlaceholder")}
                      </span>
                    </button>

                    {timeValue ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyEventSchedulePatch({ dueTime: "" });
                        }}
                        className="ml-1 p-0.5 rounded text-neutral-400 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title={t("removeTime")}
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <ChevronRight
                        size={13}
                        className={cn(
                          "text-neutral-500 shrink-0 ml-1 transition-transform",
                          hourPopover.isOpen && "rotate-90 text-gold",
                        )}
                      />
                    )}
                  </div>

                  {/* Sub-popover Flutuante via Portal: Seleção de Hora */}
                  {hourPopover.isOpen &&
                    hourPopover.shouldRenderPortal &&
                    hourPopover.coords &&
                    createPortal(
                      <div
                        ref={hourPopover.popoverRef}
                        role="dialog"
                        aria-modal="false"
                        aria-label={t("setTimeTitle")}
                        data-select-for={hourTriggerId}
                        style={hourPopover.floatingStyle}
                        className={cn(
                          "bg-popover rounded-xl p-3 flex flex-col justify-between border border-primary/40 shadow-2xl max-w-[calc(100vw-1rem)] animate-in fade-in zoom-in-95 duration-150 select-none overflow-y-auto custom-scrollbar",
                          hourPopover.coords.placement === "top"
                            ? "origin-bottom"
                            : "origin-top",
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gold" />
                            <span className="text-xs font-bold text-neutral-100">
                              {t("setTimeTitle")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={hourPopover.close}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label={t("clear")}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Controles Compartilhados de Horário */}
                        <TimePickerBody
                          value={timeValue}
                          isOpen={hourPopover.isOpen}
                          onChange={(val) =>
                            applyEventSchedulePatch({
                              dueTime: val,
                              startTime: "",
                              endTime: "",
                              isAllDay: false,
                            })
                          }
                        />

                        {/* Footer do Overlay de Hora */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-700 dark:border-white/10 text-label-g gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSetNow}
                              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                            >
                              {tTime("now")}
                            </button>
                            {timeValue && (
                              <button
                                type="button"
                                onClick={() => {
                                  applyEventSchedulePatch({
                                    dueTime: "",
                                    startTime: "",
                                    endTime: "",
                                    isAllDay: false,
                                  });
                                  hourPopover.close();
                                }}
                                className="text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer text-tiny font-medium"
                              >
                                {t("removeTime")}
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={hourPopover.close}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gold hover:bg-gold-hover text-on-gold font-bold text-tiny shadow-glow-gold-xs transition-colors cursor-pointer"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>{t("confirm")}</span>
                          </button>
                        </div>
                      </div>,
                      document.body,
                    )}
                </div>

                {/* 2. Gatilho Evento (Exclusivo Premium) */}
                <div
                  ref={eventPopover.containerRef}
                  id={eventTriggerId}
                  className="relative"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors",
                      eventPopover.isOpen
                        ? "border-info/50 bg-info/10"
                        : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPremium) {
                          toast.info(t("eventPremiumToast"));
                          hourPopover.close();
                          eventPopover.close();
                          close();
                          setIsUpgradeModalOpen(true);
                          return;
                        }
                        if (eventPopover.isOpen) {
                          eventPopover.close();
                          return;
                        }
                        hourPopover.close();
                        if (!currentValue) updateValue(today.isoString);
                        if (!allDayValue && !startTimeValue) {
                          const now = new Date();
                          const startH = (now.getHours() + 1) % 24;
                          const endH = (startH + 1) % 24;
                          const defaultStart = `${String(startH).padStart(2, "0")}:00`;
                          const defaultEnd =
                            endH > startH
                              ? `${String(endH).padStart(2, "0")}:00`
                              : "23:59";
                          applyEventSchedulePatch({
                            dueTime: "",
                            startTime: defaultStart,
                            endTime: defaultEnd,
                            isAllDay: false,
                          });
                        } else if (timeValue) {
                          applyEventSchedulePatch({ dueTime: "" });
                        }
                        eventPopover.open();
                      }}
                      className="flex items-center justify-between flex-1 text-left text-label-g font-semibold text-neutral-200 hover:text-info transition-colors cursor-pointer min-w-0"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <CalendarClock
                          size={12}
                          className="text-info shrink-0"
                        />
                        <span>{t("eventLabel")}</span>
                        <Crown
                          size={11}
                          className="text-gold fill-gold shrink-0"
                        />
                        {hasEventValue && (
                          <span className="px-1.5 py-0.5 rounded bg-info/15 text-info text-tiny font-bold tabular-nums truncate max-w-[120px]">
                            {allDayValue
                              ? t("allDayBadge")
                              : formattedStart && formattedEnd
                                ? `${formattedStart}–${formattedEnd}`
                                : formattedStart}
                          </span>
                        )}
                      </span>
                      <span className="text-tiny text-neutral-400 font-normal">
                        {hasEventValue ? "" : t("addEventPlaceholder")}
                      </span>
                    </button>

                    {hasEventValue ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyEventSchedulePatch({
                            startTime: "",
                            endTime: "",
                            isAllDay: false,
                          });
                        }}
                        className="ml-1 p-0.5 rounded text-neutral-400 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title={t("removeTime")}
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <ChevronRight
                        size={13}
                        className={cn(
                          "text-neutral-500 shrink-0 ml-1 transition-transform",
                          eventPopover.isOpen && "rotate-90 text-info",
                        )}
                      />
                    )}
                  </div>

                  {/* Sub-popover Flutuante via Portal: Configuração de Evento */}
                  {eventPopover.isOpen &&
                    eventPopover.shouldRenderPortal &&
                    eventPopover.coords &&
                    createPortal(
                      <div
                        ref={eventPopover.popoverRef}
                        role="dialog"
                        aria-modal="false"
                        aria-label={t("setEventTitle")}
                        data-select-for={eventTriggerId}
                        style={eventPopover.floatingStyle}
                        className={cn(
                          "bg-popover rounded-xl p-3 flex flex-col justify-between border border-primary/40 shadow-2xl max-w-[calc(100vw-1rem)] animate-in fade-in zoom-in-95 duration-150 select-none overflow-y-auto custom-scrollbar",
                          eventPopover.coords.placement === "top"
                            ? "origin-bottom"
                            : "origin-top",
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock size={15} className="text-info" />
                            <span className="text-xs font-bold text-neutral-100">
                              {t("setEventTitle")}
                            </span>
                            <Crown
                              size={11}
                              className="text-gold fill-gold shrink-0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={eventPopover.close}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label={t("clear")}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Conteúdo do Evento */}
                        <div className="flex flex-col gap-2.5 py-2 flex-1 overflow-y-auto custom-scrollbar">
                          {/* Checkbox Dia Inteiro */}
                          <label className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors select-none">
                            <div className="flex items-center gap-2">
                              <CalendarClock
                                size={14}
                                className="text-info shrink-0"
                              />
                              <span className="text-xs font-semibold text-neutral-100">
                                {t("allDayLabel")}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={Boolean(allDayValue)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                  applyEventSchedulePatch({
                                    dueTime: "",
                                    startTime: "",
                                    endTime: "",
                                    isAllDay: true,
                                  });
                                } else {
                                  applyEventSchedulePatch({
                                    isAllDay: false,
                                  });
                                }
                              }}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={cn(
                                "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                                allDayValue
                                  ? "bg-info border-info text-neutral-950 font-bold"
                                  : "border-white/25 bg-white/5 hover:border-info/60",
                              )}
                            >
                              {allDayValue && (
                                <Check size={11} strokeWidth={3} />
                              )}
                            </span>
                          </label>

                          {allDayValue ? (
                            <div className="p-3 rounded-lg bg-info/10 border border-info/30 text-info text-xs flex items-center gap-2">
                              <CalendarClock
                                size={16}
                                className="shrink-0 text-info"
                              />
                              <span className="leading-relaxed">
                                {t("allDayInfo")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-tiny font-semibold text-neutral-300 block mb-1">
                                    {t("startTimeLabel")}
                                  </span>
                                  <TimePicker
                                    compact
                                    value={startTimeValue}
                                    onChange={(val) => {
                                      if (!val) {
                                        applyEventSchedulePatch({
                                          dueTime: "",
                                          startTime: "",
                                          endTime: "",
                                          isAllDay: false,
                                        });
                                        return;
                                      }
                                      const startMin =
                                        parseTimeToMinutes(val) ?? 0;
                                      const nextEnd =
                                        endTimeValue && endTimeValue > val
                                          ? endTimeValue
                                          : startMin < 1439
                                            ? minutesToTimeHHMM(
                                                Math.min(1439, startMin + 60),
                                              )
                                            : "";
                                      applyEventSchedulePatch({
                                        dueTime: "",
                                        startTime: val,
                                        endTime: nextEnd,
                                        isAllDay: false,
                                      });
                                    }}
                                    placeholder={t("timePlaceholder")}
                                    zIndex={170}
                                  />
                                </div>
                                <div>
                                  <span className="text-tiny font-semibold text-neutral-300 block mb-1">
                                    {t("endTimeLabel")}
                                  </span>
                                  <TimePicker
                                    compact
                                    value={endTimeValue}
                                    onChange={(val) => {
                                      applyEventSchedulePatch({
                                        dueTime: "",
                                        endTime: val,
                                        isAllDay: false,
                                      });
                                    }}
                                    disabled={!startTimeValue}
                                    placeholder={t("timePlaceholder")}
                                    hint={
                                      !startTimeValue
                                        ? t("endTimeRequiresStart")
                                        : undefined
                                    }
                                    zIndex={170}
                                  />
                                </div>
                              </div>

                              {/* Presets de duração rápida */}
                              <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                                <span className="text-tiny font-medium text-neutral-400">
                                  {t("durationLabel")}
                                </span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {EVENT_DURATION_PRESETS.map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() =>
                                        handleApplyDurationPreset(
                                          preset.minutes,
                                        )
                                      }
                                      className="py-1 px-1 rounded-md bg-white/5 border border-white/10 hover:border-info/50 hover:bg-info/10 hover:text-info text-neutral-200 text-tiny font-bold transition-colors cursor-pointer text-center"
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer do Overlay de Evento */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-700 dark:border-white/10 text-label-g gap-1.5">
                          <div>
                            {hasEventValue && (
                              <button
                                type="button"
                                onClick={() => {
                                  applyEventSchedulePatch({
                                    startTime: "",
                                    endTime: "",
                                    isAllDay: false,
                                  });
                                  eventPopover.close();
                                }}
                                className="text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer text-tiny font-medium"
                              >
                                {t("removeTime")}
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={eventPopover.close}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gold hover:bg-gold-hover text-on-gold font-bold text-tiny shadow-glow-gold-xs transition-colors cursor-pointer"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>{t("confirm")}</span>
                          </button>
                        </div>
                      </div>,
                      document.body,
                    )}
                </div>
              </div>
            )}

            {/* Rodapé com Atalhos Rápidos */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-neutral-700 dark:border-white/10 text-label-g">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                >
                  {t("tomorrow")}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {allowClear && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleClear(e);
                      close();
                    }}
                    className="text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer text-tiny font-medium"
                  >
                    {resolvedClearLabel}
                  </button>
                )}

                {enableTime && (
                  <button
                    type="button"
                    onClick={close}
                    className="px-2.5 py-0.5 rounded bg-gold hover:bg-gold-hover text-on-gold font-bold text-tiny shadow-glow-gold-xs transition-colors cursor-pointer"
                  >
                    {t("done")}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        variant === "input" ? "w-full" : "inline-flex",
      )}
    >
      {label &&
        variant === "input" &&
        (typeof label === "string" ? (
          <label
            htmlFor={pickerId}
            className="font-medium text-neutral-100 select-none text-body-s"
          >
            {label}
          </label>
        ) : (
          <div className="font-medium text-neutral-100 select-none text-body-s">
            {label}
          </div>
        ))}

      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue || ""}
          required={required}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          "relative",
          variant === "input" ? "w-full" : "inline-block",
        )}
      >
        {variant === "badge" ? (
          <button
            id={pickerId}
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={cn(
              "flex items-center gap-1.5 transition-colors font-medium text-xs px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer select-none",
              isOverdue
                ? "text-danger-500 hover:text-danger-400"
                : "text-gold hover:text-gold-hover",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            title={t("clickToChangeDate")}
          >
            <CalendarIcon
              size={13}
              className={cn(
                "shrink-0",
                isOverdue ? "text-danger-500" : "text-gold",
              )}
            />
            <span>{badgeLabel ?? displayFullText ?? resolvedPlaceholder}</span>
          </button>
        ) : (
          <div
            className={cn(
              "w-full flex items-center justify-between rounded-lg transition-colors select-none",
              compact ? "py-2 px-3 text-body-s" : "py-3 px-4 text-body-m",
              "bg-card border border-neutral-600 text-neutral-50 shadow-xs",
              "dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-50 dark:shadow-none",
              isOpen
                ? "border-primary ring-2 ring-primary/15 dark:border-gold bg-card dark:bg-gold/10 text-primary dark:text-gold dark:ring-1 dark:ring-gold dark:shadow-glow-gold-xs"
                : "hover:border-neutral-500 dark:hover:border-gold/40 dark:hover:bg-white/5",
              error && "border-danger-500/80",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            <button
              id={pickerId}
              type="button"
              onClick={toggle}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer outline-none"
            >
              <CalendarIcon
                size={compact ? 16 : 18}
                className={cn(
                  "shrink-0 transition-colors",
                  isOpen
                    ? "text-primary dark:text-gold"
                    : currentValue
                      ? "text-gold"
                      : "text-neutral-400",
                )}
              />
              <span
                className={cn(
                  "truncate font-medium",
                  currentValue ? "text-neutral-100" : "text-neutral-400",
                )}
              >
                {displayFullText || resolvedPlaceholder}
              </span>
            </button>

            {allowClear && currentValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                title={t("clearDate")}
                aria-label={t("clearDate")}
                className="p-1 rounded-md text-neutral-400 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {calendarPopover}
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger-500 font-semibold mt-0.5"
        >
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="text-xs text-neutral-400 mt-0.5">
          {hint}
        </span>
      )}

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </div>
  );
}
