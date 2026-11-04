"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { SelectItem, SelectOption, SelectProps } from "@/types/ui";
import { cn } from "@/utils";

function normalizeOption(option: SelectItem): SelectOption {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return option;
}

export function Select({
  label,
  options,
  placeholder,
  emptyMessage,
  compact = false,
  variant = "default",
  align,
  icon,
  value,
  defaultValue,
  onChange,
  name,
  id,
  disabled = false,
  required = false,
  error,
  hint,
  className,
  dropdownClassName,
  triggerClassName,
  usePortal = true,
  "aria-label": ariaLabel,
}: SelectProps) {
  const t = useTranslations("ui.select");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const resolvedEmptyMessage = emptyMessage ?? t("emptyMessage");
  const generatedId = useId();
  const selectId = id || generatedId;

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption),
    [options],
  );

  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? "",
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const currentOption = useMemo(
    () => normalizedOptions.find((opt) => opt.value === currentValue),
    [normalizedOptions, currentValue],
  );

  const isInline = variant === "inline";
  const isFilter = variant === "filter";
  const isAutoWidth = isInline || isFilter;

  const itemHeight = isInline ? 30 : compact ? 36 : 40;
  const maxAllowedHeight = isInline ? 192 : 240;
  const estimatedHeight = Math.min(
    Math.max(normalizedOptions.length, 1) * itemHeight + 8,
    maxAllowedHeight,
  );

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: align ?? (isInline ? "center" : "left"),
    estimatedHeight,
    estimatedWidth: isFilter ? 192 : 140,
    matchTriggerWidth: !isAutoWidth,
    maxAllowedHeight,
    offset: isFilter ? 6 : 4,
    disabled,
    usePortal,
  });

  // Rola automaticamente para a opção selecionada ao abrir
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const selectedEl = popoverRef.current.querySelector(
        '[aria-selected="true"]',
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, popoverRef]);

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    close();
  };

  const displayLabel = isFilter
    ? currentValue && currentOption
      ? currentOption.label
      : resolvedPlaceholder
    : currentOption
      ? currentOption.label
      : resolvedPlaceholder;

  const activeIcon = icon ?? currentOption?.icon;
  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const dropdownMenu = (
    <div
      ref={popoverRef}
      role="listbox"
      data-select-for={selectId}
      style={floatingStyle}
      className={cn(
        shouldRenderPortal ? "fixed z-[150]" : "absolute z-50",
        "bg-card dark:bg-popover/98 border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100",
        coords?.placement === "top" ? "origin-bottom" : "origin-top",
        isInline
          ? cn(
              !shouldRenderPortal && "top-[115%]",
              "min-w-[120px] max-h-48 p-1",
              !shouldRenderPortal && align === "right" && "right-0 left-auto",
              !shouldRenderPortal && align === "left" && "left-0",
              !shouldRenderPortal &&
                (!align || align === "center") &&
                "left-1/2 -translate-x-1/2",
            )
          : isFilter
            ? cn(
                !shouldRenderPortal && "top-full mt-2",
                "w-48 max-h-60 p-1.5 flex flex-col gap-0.5",
                !shouldRenderPortal &&
                  (align === "right" ? "right-0 left-auto" : "left-0"),
              )
            : cn(
                !shouldRenderPortal && "top-[105%]",
                "max-h-60",
                !shouldRenderPortal &&
                  (align === "right" ? "right-0 left-auto" : "left-0 w-full"),
              ),
        dropdownClassName,
      )}
    >
      {normalizedOptions.length === 0 ? (
        <div
          className={cn(
            "w-full text-neutral-400 italic select-none",
            isInline
              ? "px-2.5 py-1.5 text-xs"
              : compact
                ? "py-2 px-3 text-body-s"
                : "py-2.5 px-4 text-body-s",
          )}
        >
          {resolvedEmptyMessage}
        </div>
      ) : (
        normalizedOptions.map((opt) => {
          const isSelected = opt.value === currentValue;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full text-left cursor-pointer transition-colors flex items-center gap-2",
                isInline
                  ? "px-2.5 py-1.5 rounded-lg text-xs justify-between"
                  : isFilter
                    ? cn(
                        "rounded-md",
                        compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
                      )
                    : compact
                      ? "py-2 px-3 text-body-s"
                      : "py-2.5 px-4 text-body-s",
                isSelected
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-gold font-bold"
                  : "text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-100 dark:hover:bg-primary/20 dark:hover:text-neutral-50",
              )}
            >
              {opt.icon && (
                <span className="shrink-0 flex items-center justify-center">
                  {opt.icon}
                </span>
              )}
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        isAutoWidth ? "relative inline-block" : "flex flex-col w-full relative",
        !isAutoWidth && "gap-1.5",
        isOpen && "z-30",
        className,
      )}
    >
      {label &&
        !isAutoWidth &&
        (typeof label === "string" ? (
          <label
            htmlFor={selectId}
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
          value={currentValue}
          required={required}
        />
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "transition-all flex items-center cursor-pointer select-none",
          isInline
            ? cn(
                "px-2 py-0.5 rounded-md text-xs font-bold gap-1.5",
                isOpen
                  ? "bg-gold/15 text-gold border border-gold/40 shadow-glow-gold-xs"
                  : "bg-transparent text-neutral-100 hover:text-gold hover:bg-white/10 border border-transparent hover:border-white/10",
              )
            : isFilter
              ? cn(
                  "gap-2 rounded-lg bg-surface border font-medium focus:outline-none focus:ring-2 focus:ring-gold/50",
                  compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
                  currentValue
                    ? "border-gold text-gold font-bold"
                    : "border-white/20 text-neutral-200 hover:border-white/30",
                )
              : cn(
                  "w-full rounded-lg text-left justify-between",
                  compact ? "py-2 px-3 text-body-s" : "py-3 px-4 text-body-m",
                  "bg-card border border-neutral-600 text-neutral-50 shadow-xs",
                  "dark:bg-primary-dark/20 dark:border-primary/30 dark:shadow-none",
                  "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-gold dark:focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
                  isOpen
                    ? "border-primary ring-2 ring-primary/15 dark:ring-0 dark:border-primary-light bg-card dark:bg-primary-dark/30 dark:shadow-[0_0_8px_rgba(168,99,255,0.3)]"
                    : "hover:border-neutral-500 dark:hover:border-primary/50",
                  error && "border-danger-500/80",
                  currentOption ? "text-neutral-50" : "text-neutral-400",
                ),
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "flex items-center truncate",
            isInline ? "gap-1.5" : "gap-2",
          )}
        >
          {activeIcon && (
            <span className="shrink-0 flex items-center justify-center">
              {activeIcon}
            </span>
          )}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          size={
            isInline ? 12 : isFilter ? (compact ? 12 : 14) : compact ? 16 : 18
          }
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen &&
              (isInline || isFilter
                ? "rotate-180 text-gold"
                : "rotate-180 text-primary-light"),
          )}
        />
      </button>

      {isOpen &&
        !disabled &&
        (shouldRenderPortal
          ? coords && createPortal(dropdownMenu, document.body)
          : dropdownMenu)}

      {error && !isAutoWidth && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger-500 font-semibold mt-0.5"
        >
          {error}
        </span>
      )}
      {hint && !error && !isAutoWidth && (
        <span id={hintId} className="text-xs text-neutral-400 mt-0.5">
          {hint}
        </span>
      )}
    </div>
  );
}
