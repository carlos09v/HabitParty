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
import type { TimePickerProps } from "@/types/ui";
import { cn } from "@/utils";
import {
  formatTimeHHMM,
  formatTimeParts,
  HOURS_LIST,
  parseTimeParts,
  QUICK_MINUTES_LIST,
} from "@/utils/date";

const TIME_POPOVER_WIDTH = 240;
const TIME_POPOVER_ESTIMATED_HEIGHT = 275;

interface TimeStepperProps {
  value: number;
  unit: "h" | "m";
  decrementLabel: string;
  incrementLabel: string;
  onChange: (nextVal: number) => void;
}

function TimeStepper({
  value,
  unit,
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
        {String(value).padStart(2, "0")}
        {unit}
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

interface TimeScrollColumnProps {
  colRef: RefObject<HTMLDivElement | null>;
  items: readonly number[];
  selectedValue: number;
  unit: "h" | "m";
  onSelect: (val: number) => void;
}

function TimeScrollColumn({
  colRef,
  items,
  selectedValue,
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
              "py-1 rounded-lg text-xs font-medium tabular-nums transition-all cursor-pointer text-center",
              isSelected
                ? "bg-gold text-on-gold font-bold shadow-glow-gold-xs"
                : "text-neutral-200 hover:bg-white/10 hover:text-gold",
            )}
          >
            {String(item).padStart(2, "0")}
            {unit}
          </button>
        );
      })}
    </div>
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
}: TimePickerProps) {
  const t = useTranslations("ui.timePicker");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const generatedId = useId();
  const pickerId = id || generatedId;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const hoursColRef = useRef<HTMLDivElement>(null);
  const minutesColRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const { hour, minute } = useMemo(
    () => parseTimeParts(currentValue),
    [currentValue],
  );

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
  });

  // Centraliza o item ativo nas listas de rolagem ao abrir o popover
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

  const updateValue = (nextVal: string) => {
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const handleSelectHour = (nextHour: number) => {
    const wrapped = ((nextHour % 24) + 24) % 24;
    updateValue(formatTimeParts(wrapped, minute));
  };

  const handleSelectMinute = (nextMinute: number) => {
    const wrapped = ((nextMinute % 60) + 60) % 60;
    updateValue(formatTimeParts(hour, wrapped));
  };

  const handleSetNow = () => {
    updateValue(formatTimeHHMM(new Date()));
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
              "p-3 rounded-xl border border-primary/40 bg-popover/98 backdrop-blur-md shadow-2xl",
              "w-60 max-w-[calc(100vw-1rem)] animate-in fade-in zoom-in-95 duration-150 select-none",
              coords.placement === "top" ? "origin-bottom" : "origin-top",
            )}
          >
            {/* Controles finos de Hora : Minuto no topo */}
            <div className="flex items-center justify-center gap-2 pb-2.5 mb-2 border-b border-white/10">
              <TimeStepper
                value={hour}
                unit="h"
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
            </div>

            {/* Cabeçalhos das colunas */}
            <div className="grid grid-cols-2 gap-2 text-center mb-1">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                {t("hourHeader")}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                {t("minuteHeader")}
              </span>
            </div>

            {/* Colunas de seleção rápida (Horas 00-23 | Minutos de 5 em 5) */}
            <div className="grid grid-cols-2 gap-2">
              <TimeScrollColumn
                colRef={hoursColRef}
                items={HOURS_LIST}
                selectedValue={hour}
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
                  close();
                }}
              />
            </div>

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
              <span>{currentValue || badgeLabel || resolvedPlaceholder}</span>
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
              "w-full flex items-center justify-between rounded-lg transition-all select-none",
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
                      ? "text-neutral-400 dark:text-gold"
                      : "text-neutral-400",
                )}
              />
              <span
                className={cn(
                  "truncate font-semibold tabular-nums",
                  currentValue ? "text-neutral-100" : "text-neutral-400",
                )}
              >
                {currentValue || resolvedPlaceholder}
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
