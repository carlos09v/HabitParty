"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { DatePickerProps } from "@/types/ui";
import { cn } from "@/utils";
import {
  FULL_MONTHS_BR,
  formatDateParts,
  formatShortDate,
  generateCalendarGrid,
  getPopoverDueDateInfo,
  parseDateParts,
  SHORT_WEEK_DAYS_BR,
} from "@/utils/date";

/**
 * Seletor de data (DatePicker) universal e característico do ecossistema HabitParty.
 * Elimina o visual genérico do navegador e suporta:
 * - Variante "input": formulários, modais, cadastro e configurações (com label, hint, error e FormData).
 * - Variante "badge": gatilho compacto estilo pílula (para cabeçalhos de tarefas To-Do/Rotina).
 * - Seletores rápidos de mês e ano no cabeçalho (ideal para datas de nascimento ou prazos distantes).
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
  placeholder = "Selecione uma data...",
  disabled = false,
  minDate,
  maxDate,
  allowClear = true,
  compact = false,
  className,
  error,
  hint,
  align = "left",
  yearRange,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const containerRef = useRef<HTMLDivElement>(null);

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
    };
  }, []);

  const [viewYear, setViewYear] = useState(() => {
    if (selectedParts) return selectedParts.year;
    if (maxDate && maxDate < today.isoString) {
      return parseDateParts(maxDate)?.year ?? today.year;
    }
    return today.year;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedParts) return selectedParts.month;
    if (maxDate && maxDate < today.isoString) {
      return parseDateParts(maxDate)?.month ?? today.month;
    }
    return today.month;
  });

  useClickOutside(containerRef, () => setIsOpen(false), {
    enabled: isOpen,
    onEscape: () => setIsOpen(false),
  });

  const updateValue = (nextVal: string) => {
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const handleOpen = () => {
    if (disabled) return;
    if (selectedParts) {
      setViewYear(selectedParts.year);
      setViewMonth(selectedParts.month);
    } else if (maxDate && maxDate < today.isoString) {
      const maxParts = parseDateParts(maxDate);
      if (maxParts) {
        setViewYear(maxParts.year);
        setViewMonth(maxParts.month);
      } else {
        setViewYear(today.year);
        setViewMonth(today.month);
      }
    } else {
      setViewYear(today.year);
      setViewMonth(today.month);
    }
    setIsOpen(!isOpen);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (year: number, month: number, day: number) => {
    const iso = formatDateParts(year, month, day);
    updateValue(iso);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateValue("");
  };

  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = formatDateParts(d.getFullYear(), d.getMonth(), d.getDate());
    updateValue(iso);
    setIsOpen(false);
  };

  // Grade de 35 a 42 células de dias
  const calendarDays = useMemo(() => {
    return generateCalendarGrid(viewYear, viewMonth, currentValue, {
      minDate,
      maxDate,
    });
  }, [viewYear, viewMonth, currentValue, minDate, maxDate]);

  // Lista de anos para o dropdown rápido
  const yearsList = useMemo(() => {
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

    const list: number[] = [];
    for (let y = max; y >= min; y--) {
      list.push(y);
    }
    return list;
  }, [today.year, yearRange, maxDate, minDate]);

  // Opções para os seletores estilizados de Mês e Ano
  const monthOptions = useMemo(
    () =>
      FULL_MONTHS_BR.map((m, idx) => ({
        value: String(idx),
        label: m,
      })),
    [],
  );

  const yearOptions = useMemo(
    () =>
      yearsList.map((y) => ({
        value: String(y),
        label: String(y),
      })),
    [yearsList],
  );

  // Texto formatado para o gatilho
  const displayDateText = useMemo(() => {
    if (!currentValue) return null;
    const info = getPopoverDueDateInfo(currentValue);
    if (info.isToday) return "Hoje";
    if (
      currentValue === formatDateParts(today.year, today.month, today.day + 1)
    ) {
      return "Amanhã";
    }
    return formatShortDate(currentValue, { includeYear: true }) || currentValue;
  }, [currentValue, today]);

  const dateInfo = useMemo(() => {
    return getPopoverDueDateInfo(currentValue);
  }, [currentValue]);

  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        variant === "input" ? "w-full" : "inline-flex",
      )}
    >
      {/* Label para o modo input */}
      {label && variant === "input" && (
        <label
          htmlFor={id}
          className="font-medium text-neutral-100 select-none text-body-s"
        >
          {label}
        </label>
      )}

      {/* Input oculto para submissão via HTML Form / FormData */}
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
        {/* ========================================================
            1. GATILHO: VARIANTE BADGE (Compacto para Detalhes de Tarefas)
            ======================================================== */}
        {variant === "badge" ? (
          <button
            id={id}
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={cn(
              "flex items-center gap-1.5 transition-colors font-medium text-xs px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer select-none",
              dateInfo.isOverdue
                ? "text-danger-500 hover:text-danger-400"
                : "text-gold hover:text-gold-hover",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            title="Clique para alterar a data"
          >
            <CalendarIcon
              size={13}
              className={cn(
                "shrink-0",
                dateInfo.isOverdue ? "text-danger-500" : "text-gold",
              )}
            />
            <span>{dateInfo.label}</span>
          </button>
        ) : (
          /* ========================================================
             2. GATILHO: VARIANTE INPUT (Formulários e Modais)
             ======================================================== */
          <div
            className={cn(
              "w-full flex items-center justify-between rounded-lg transition-all select-none",
              compact ? "py-2 px-3 text-body-s" : "py-3 px-4 text-body-m",
              // Tema Claro
              "bg-card border border-neutral-700 text-neutral-50 shadow-xs",
              // Tema Escuro
              "dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-50 dark:shadow-none",
              // Foco e Abertura com anel dourado
              isOpen
                ? "border-gold bg-gold/10 text-gold ring-1 ring-gold shadow-glow-gold-xs"
                : "hover:border-gold/40 hover:bg-white/5",
              error && "border-danger-500/80",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            <button
              id={id}
              type="button"
              onClick={handleOpen}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-invalid={error ? true : undefined}
              className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer outline-none"
            >
              <CalendarIcon
                size={compact ? 16 : 18}
                className={cn(
                  "shrink-0 transition-colors",
                  isOpen || currentValue ? "text-gold" : "text-neutral-400",
                )}
              />
              <span
                className={cn(
                  "truncate font-medium",
                  currentValue ? "text-neutral-100" : "text-neutral-400",
                )}
              >
                {displayDateText || placeholder}
              </span>
            </button>

            {allowClear && currentValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                title="Limpar data"
                aria-label="Limpar data"
                className="p-1 rounded-md text-neutral-400 hover:text-danger-500 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* ========================================================
            3. DROPDOWN POPOVER DO CALENDÁRIO UNIVERSAL
            ======================================================== */}
        {isOpen && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label="Selecionar data"
            className={cn(
              "absolute top-full mt-1.5 z-50 p-3 rounded-xl border border-primary/40 bg-popover/98 backdrop-blur-md shadow-2xl",
              "w-72 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150 select-none",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {/* Header com Navegação Mensal e Seletores Rápidos de Mês/Ano */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 gap-1 relative z-20">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Mês anterior"
                title="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center justify-center gap-1 flex-1 min-w-0">
                {/* Seletor de Mês */}
                <Select
                  variant="inline"
                  value={String(viewMonth)}
                  onChange={(val) => setViewMonth(Number(val))}
                  options={monthOptions}
                  dropdownClassName="min-w-[130px]"
                  aria-label="Selecionar mês"
                />

                {/* Seletor de Ano */}
                <Select
                  variant="inline"
                  value={String(viewYear)}
                  onChange={(val) => setViewYear(Number(val))}
                  options={yearOptions}
                  dropdownClassName="min-w-[90px]"
                  aria-label="Selecionar ano"
                />
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Próximo mês"
                title="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {SHORT_WEEK_DAYS_BR.map((day) => (
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
              {calendarDays.map((cell) => {
                return (
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
                        ? "bg-gold text-neutral-900 font-bold shadow-glow-gold-xs"
                        : "hover:bg-white/10 hover:text-gold",
                      cell.isDisabled &&
                        "opacity-20 cursor-not-allowed hover:bg-transparent hover:text-neutral-500",
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Rodapé com Atalhos Rápidos */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 hover:text-gold hover:border-gold/30 transition-colors cursor-pointer text-tiny"
                >
                  Amanhã
                </button>
              </div>

              {allowClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleClear(e);
                    setIsOpen(false);
                  }}
                  className="text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer text-tiny font-medium"
                >
                  {variant === "badge" ? "Sem prazo" : "Limpar"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mensagens de Erro ou Dica */}
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
