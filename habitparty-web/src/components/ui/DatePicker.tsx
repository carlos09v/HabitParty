"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Select } from "@/components/ui/Select";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { isValidLocale } from "@/i18n/config";
import type { DatePickerProps } from "@/types/ui";
import { cn } from "@/utils";
import {
  formatDateParts,
  formatShortDate,
  generateCalendarGrid,
  getFullMonths,
  getOffsetDateString,
  getShortWeekDays,
  parseDateParts,
} from "@/utils/date";

const CALENDAR_POPOVER_WIDTH = 288;
const CALENDAR_POPOVER_ESTIMATED_HEIGHT = 315;

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
}: DatePickerProps) {
  const t = useTranslations("ui.datePicker");
  const rawLocale = useLocale();
  const locale = isValidLocale(rawLocale) ? rawLocale : "en";
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

  const selectedParts = useMemo(
    () => parseDateParts(currentValue),
    [currentValue],
  );

  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      isoString: formatDateParts(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ),
      tomorrowIso: getOffsetDateString(1, now),
    };
  }, []);

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
    estimatedHeight: CALENDAR_POPOVER_ESTIMATED_HEIGHT,
    estimatedWidth: CALENDAR_POPOVER_WIDTH,
    matchTriggerWidth: false,
    offset: 6,
    disabled,
    onOpen: syncViewToSelection,
  });

  const updateValue = (nextVal: string) => {
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
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
    close();
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateValue("");
  };

  const handleSetQuickDate = (offsetDays: number) => {
    updateValue(getOffsetDateString(offsetDays));
    close();
  };

  const calendarDays = useMemo(
    () =>
      generateCalendarGrid(viewYear, viewMonth, currentValue, {
        minDate,
        maxDate,
      }),
    [viewYear, viewMonth, currentValue, minDate, maxDate],
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
      formatShortDate(currentValue, { includeYear: true, locale }) ||
      currentValue
    );
  }, [currentValue, today.isoString, today.tomorrowIso, locale, t]);

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
              "p-3 rounded-xl border border-primary/40 bg-popover/98 backdrop-blur-md shadow-2xl",
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
                  className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider"
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
                    "h-7 w-7 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative",
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

            {/* Rodapé com Atalhos Rápidos */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px]">
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
            <span>{badgeLabel ?? displayDateText ?? resolvedPlaceholder}</span>
          </button>
        ) : (
          <div
            className={cn(
              "w-full flex items-center justify-between rounded-lg transition-all select-none",
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
                      ? "text-neutral-400 dark:text-gold"
                      : "text-neutral-400",
                )}
              />
              <span
                className={cn(
                  "truncate font-medium",
                  currentValue ? "text-neutral-100" : "text-neutral-400",
                )}
              >
                {displayDateText || resolvedPlaceholder}
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
    </div>
  );
}
