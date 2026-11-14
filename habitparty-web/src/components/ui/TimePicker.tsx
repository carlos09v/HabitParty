"use client";

import { Check, Clock, Minus, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { useUserStore } from "@/store/userStore";
import type { TimePickerProps } from "@/types/ui";
import { cn } from "@/utils";
import {
  formatTimeDisplay,
  formatTimeHHMM,
  formatTimeParts,
  HOURS_LIST,
  parseTimeParts,
  QUICK_MINUTES_LIST,
} from "@/utils/date";

const TIME_POPOVER_WIDTH = 240;
const TIME_POPOVER_ESTIMATED_HEIGHT = 275;

export interface TimeStepperProps {
  value: number;
  unit: "h" | "m";
  displayValue?: string;
  decrementLabel: string;
  incrementLabel: string;
  onChange: (nextVal: number) => void;
}

export function TimeStepper({
  value,
  unit,
  displayValue,
  decrementLabel,
  incrementLabel,
  onChange,
}: TimeStepperProps) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1.5 py-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="p-0.5 rounded text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
        aria-label={decrementLabel}
      >
        <Minus size={12} />
      </button>
      <span className="w-6 text-center text-xs font-bold tabular-nums text-gold">
        {displayValue ?? `${String(value).padStart(2, "0")}${unit}`}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="p-0.5 rounded text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
        aria-label={incrementLabel}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

export interface TimeScrollColumnProps {
  colRef: RefObject<HTMLDivElement | null>;
  items: readonly number[];
  selectedValue: number;
  formatItemLabel?: (val: number) => string;
  unit: "h" | "m";
  onSelect: (val: number) => void;
}

export function TimeScrollColumn({
  colRef,
  items,
  selectedValue,
  formatItemLabel,
  unit,
  onSelect,
}: TimeScrollColumnProps) {
  return (
    <div
      ref={colRef}
      className="h-36 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1"
    >
      {items.map((item) => {
        const isSelected = item === selectedValue;
        return (
          <button
            key={item}
            type="button"
            data-active={isSelected}
            onClick={() => onSelect(item)}
            className={cn(
              "py-1 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer text-center",
              isSelected
                ? "bg-gold text-on-gold font-bold shadow-glow-gold-xs"
                : "text-neutral-200 hover:bg-white/10 hover:text-gold",
            )}
          >
            {formatItemLabel
              ? formatItemLabel(item)
              : `${String(item).padStart(2, "0")}${unit}`}
          </button>
        );
      })}
    </div>
  );
}

export interface TimePickerBodyProps {
  value?: string;
  isOpen?: boolean;
  onChange: (nextVal: string) => void;
  onMinuteSelect?: () => void;
}

/**
 * Painel interno reutilizável de seleção de hora e minuto (steppers + colunas roláveis + 12h/24h).
 * Compartilhado entre o TimePicker standalone e o sub-popover de Hora do DatePicker.
 */
export function TimePickerBody({
  value,
  isOpen = true,
  onChange,
  onMinuteSelect,
}: TimePickerBodyProps) {
  const t = useTranslations("ui.timePicker");
  const { timeFormat } = useTimeFormat();
  const hoursColRef = useRef<HTMLDivElement>(null);
  const minutesColRef = useRef<HTMLDivElement>(null);

  const { hour, minute } = useMemo(() => parseTimeParts(value), [value]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollActiveIntoView = (container: HTMLDivElement | null) => {
      if (!container) return;
      const activeBtn = container.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      if (activeBtn) {
        const offset =
          activeBtn.offsetTop -
          container.clientHeight / 2 +
          activeBtn.clientHeight / 2;
        container.scrollTo({ top: Math.max(0, offset), behavior: "instant" });
      }
    };
    scrollActiveIntoView(hoursColRef.current);
    scrollActiveIntoView(minutesColRef.current);
  }, [isOpen]);

  const handleSelectHour = (nextHour: number) => {
    const wrapped = ((nextHour % 24) + 24) % 24;
    onChange(formatTimeParts(wrapped, minute));
  };

  const handleSelectMinute = (nextMinute: number) => {
    const wrapped = ((nextMinute % 60) + 60) % 60;
    onChange(formatTimeParts(hour, wrapped));
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2 pb-2.5 mb-2 border-b border-white/10">
        <TimeStepper
          value={hour}
          unit="h"
          displayValue={
            timeFormat === "12h"
              ? `${String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, "0")}h`
              : undefined
          }
          decrementLabel={t("decrementHour")}
          incrementLabel={t("incrementHour")}
          onChange={handleSelectHour}
        />
        <span className="text-neutral-400 font-bold text-xs">:</span>
        <TimeStepper
          value={minute}
          unit="m"
          decrementLabel={t("decrementMinute")}
          incrementLabel={t("incrementMinute")}
          onChange={handleSelectMinute}
        />
        {timeFormat === "12h" && (
          <button
            type="button"
            onClick={() => handleSelectHour(hour >= 12 ? hour - 12 : hour + 12)}
            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-gold/20 text-gold text-xs font-bold cursor-pointer transition-colors"
          >
            {hour >= 12 ? "PM" : "AM"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center mb-1">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
          {t("hourHeader")}
        </span>
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
          {t("minuteHeader")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TimeScrollColumn
          colRef={hoursColRef}
          items={HOURS_LIST}
          selectedValue={hour}
          formatItemLabel={(h) =>
            timeFormat === "12h"
              ? `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
              : `${String(h).padStart(2, "0")}h`
          }
          unit="h"
          onSelect={handleSelectHour}
        />
        <TimeScrollColumn
          colRef={minutesColRef}
          items={QUICK_MINUTES_LIST}
          selectedValue={minute}
          unit="m"
          onSelect={(m) => {
            handleSelectMinute(m);
            onMinuteSelect?.();
          }}
        />
      </div>
    </>
  );
}

/**
 * Seletor de horário (TimePicker) universal do ecossistema HabitParty.
 * Renderiza via Portal (position: fixed) usando useFloatingPopover para sobrepor modais sem criar scroll.
 */
export function TimePicker({
  id,
  label,
  value,
  defaultValue,
  onChange,
  name,
  required,
  variant = "input",
  badgeLabel,
  clearLabel,
  isOverdue = false,
  placeholder,
  disabled = false,
  allowClear = false,
  compact = false,
  className,
  error,
  hint,
  align = "left",
  zIndex,
}: TimePickerProps) {
  const t = useTranslations("ui.timePicker");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const generatedId = useId();
  const pickerId = id || generatedId;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const { timeFormat } = useTimeFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const displayTime = currentValue
    ? formatTimeDisplay(currentValue, { timeFormat })
    : "";

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
    estimatedHeight: TIME_POPOVER_ESTIMATED_HEIGHT,
    estimatedWidth: TIME_POPOVER_WIDTH,
    matchTriggerWidth: false,
    offset: 6,
    disabled,
    zIndex,
  });

  const updateValue = (nextVal: string) => {
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const handleSetNow = () => {
    updateValue(formatTimeHHMM(new Date(), userTimeZone));
    close();
  };

  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const timePopover =
    isOpen && shouldRenderPortal && coords
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label={t("dialogAria")}
            data-select-for={pickerId}
            style={floatingStyle}
            className={cn(
              "p-3 rounded-xl border border-primary/40 bg-popover shadow-2xl",
              "w-60 max-w-[calc(100vw-1rem)] animate-in fade-in zoom-in-95 duration-150 select-none",
              coords.placement === "top" ? "origin-bottom" : "origin-top",
            )}
          >
            <TimePickerBody
              value={currentValue}
              isOpen={isOpen}
              onChange={updateValue}
              onMinuteSelect={close}
            />

            {/* Rodapé com atalho Agora + Limpar + Confirmar */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px] gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                >
                  {t("now")}
                </button>
                {allowClear && currentValue && (
                  <button
                    type="button"
                    onClick={() => {
                      updateValue("");
                      close();
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 hover:text-danger-500 hover:border-danger-500/30 transition-colors cursor-pointer text-tiny"
                  >
                    {clearLabel || t("clearAria")}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={close}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-gold/15 border border-gold/40 text-gold hover:bg-gold hover:text-on-gold transition-colors cursor-pointer text-tiny font-bold"
              >
                <Check size={11} />
                {t("confirm")}
              </button>
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
          <div className="inline-flex items-center">
            <button
              id={pickerId}
              type="button"
              onClick={toggle}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              className={cn(
                "flex items-center gap-1 transition-colors font-medium text-xs px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer select-none tabular-nums",
                currentValue
                  ? isOverdue
                    ? "text-danger-500 hover:text-danger-400"
                    : "text-gold hover:text-gold-hover"
                  : "text-neutral-400 hover:text-neutral-200",
                disabled && "opacity-50 cursor-not-allowed",
                className,
              )}
              title={badgeLabel || resolvedPlaceholder}
            >
              <Clock
                size={12}
                className={cn(
                  "shrink-0",
                  currentValue
                    ? isOverdue
                      ? "text-danger-500"
                      : "text-gold"
                    : "text-neutral-400",
                )}
              />
              <span>{displayTime || badgeLabel || resolvedPlaceholder}</span>
            </button>
            {allowClear && currentValue && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateValue("");
                }}
                title={clearLabel || t("clearAria")}
                aria-label={clearLabel || t("clearAria")}
                className="p-0.5 rounded text-neutral-500 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "w-full flex items-center justify-between rounded-lg transition-colors select-none",
              compact ? "py-2 px-3 text-body-s" : "py-3 px-4 text-body-m",
              "bg-card border border-neutral-600 text-neutral-50 shadow-xs",
              "dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-50 dark:shadow-none",
              isOpen
                ? "border-primary ring-2 ring-primary/15 bg-card text-primary dark:border-gold dark:bg-gold/10 dark:text-gold dark:ring-1 dark:ring-gold dark:shadow-glow-gold-xs"
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
              className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer outline-none"
            >
              <Clock
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
                  "truncate font-semibold tabular-nums",
                  currentValue ? "text-neutral-100" : "text-neutral-400",
                )}
              >
                {displayTime || resolvedPlaceholder}
              </span>
            </button>

            {allowClear && currentValue && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateValue("");
                }}
                title={t("clearAria")}
                aria-label={t("clearAria")}
                className="p-1 rounded-md text-neutral-400 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {timePopover}
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
