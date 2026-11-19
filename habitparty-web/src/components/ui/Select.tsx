"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
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

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function Select({
  label,
  options,
  placeholder,
  emptyMessage,
  searchable = false,
  searchPlaceholder,
  noResultsMessage,
  filterTabs,
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
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("searchPlaceholder");
  const resolvedNoResultsMessage = noResultsMessage ?? t("noResultsMessage");
  const generatedId = useId();
  const selectId = id || generatedId;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const indexedOptions = useMemo(
    () =>
      options.map((rawOption) => {
        const option = normalizeOption(rawOption);
        const searchHaystack = normalizeSearchText(
          [
            option.label,
            option.badge,
            option.meta,
            option.keywords,
            option.group,
          ]
            .filter(Boolean)
            .join(" "),
        );
        return { option, searchHaystack };
      }),
    [options],
  );

  const normalizedOptions = useMemo(
    () => indexedOptions.map((item) => item.option),
    [indexedOptions],
  );

  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const currentOption = useMemo(
    () => normalizedOptions.find((opt) => opt.value === currentValue),
    [normalizedOptions, currentValue],
  );

  const filteredOptions = useMemo(() => {
    const query = searchable ? normalizeSearchText(searchQuery.trim()) : "";
    const hasFilterTabs = Boolean(
      searchable &&
        filterTabs &&
        filterTabs.length > 0 &&
        activeFilterTab !== "",
    );

    if (!query && !hasFilterTabs) {
      return normalizedOptions;
    }

    return indexedOptions
      .filter(({ option, searchHaystack }) => {
        if (hasFilterTabs && option.group !== activeFilterTab) {
          return false;
        }
        if (!query) return true;
        return searchHaystack.includes(query);
      })
      .map((item) => item.option);
  }, [
    indexedOptions,
    normalizedOptions,
    searchable,
    searchQuery,
    filterTabs,
    activeFilterTab,
  ]);

  const isInline = variant === "inline";
  const isFilter = variant === "filter";
  const isAutoWidth = isInline || isFilter;
  const hasExplicitWidth = Boolean(
    className && /\b(w-full|w-\S+|flex-1)\b/.test(className),
  );

  const itemHeight = isInline ? 30 : compact ? 36 : 40;
  const maxAllowedHeight = isInline ? 192 : searchable ? 320 : 240;
  const searchHeaderHeight = searchable
    ? filterTabs && filterTabs.length > 0
      ? 78
      : 46
    : 0;
  const estimatedHeight = Math.min(
    Math.max(filteredOptions.length, 1) * itemHeight + 8 + searchHeaderHeight,
    maxAllowedHeight,
  );

  const listboxId = `${selectId}-listbox`;
  const getOptionId = (index: number) => `${selectId}-opt-${index}`;

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

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setActiveFilterTab("");
      setHighlightedIndex(-1);
      return;
    }

    if (searchable) {
      const rafId = window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(rafId);
    }

    if (popoverRef.current) {
      const selectedEl = popoverRef.current.querySelector(
        '[aria-selected="true"]',
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, popoverRef, searchable]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !popoverRef.current) return;
    const optionEl = popoverRef.current.querySelector<HTMLElement>(
      `[id="${selectId}-opt-${highlightedIndex}"]`,
    );
    if (optionEl) {
      optionEl.scrollIntoView({ block: "nearest" });
      if (!searchable) {
        optionEl.focus();
      }
    }
  }, [highlightedIndex, isOpen, popoverRef, searchable, selectId]);

  const moveHighlight = (delta: 1 | -1) => {
    if (filteredOptions.length === 0) return;
    setHighlightedIndex((prev) => {
      if (prev < 0) return delta > 0 ? 0 : filteredOptions.length - 1;
      return (prev + delta + filteredOptions.length) % filteredOptions.length;
    });
  };

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    close();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Home" && filteredOptions.length > 0) {
      e.preventDefault();
      setHighlightedIndex(0);
    } else if (e.key === "End" && filteredOptions.length > 0) {
      e.preventDefault();
      setHighlightedIndex(filteredOptions.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target =
        filteredOptions[highlightedIndex >= 0 ? highlightedIndex : 0];
      if (target) {
        handleSelect(target.value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      if (!isOpen) {
        toggle();
        if (!searchable) {
          const selectedIdx = filteredOptions.findIndex(
            (opt) => opt.value === currentValue,
          );
          setHighlightedIndex(
            selectedIdx >= 0
              ? selectedIdx
              : delta > 0
                ? 0
                : Math.max(filteredOptions.length - 1, 0),
          );
        }
      } else if (!searchable) {
        moveHighlight(delta);
      }
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      close();
    }
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (searchable) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Home" && filteredOptions.length > 0) {
      e.preventDefault();
      setHighlightedIndex(0);
    } else if (e.key === "End" && filteredOptions.length > 0) {
      e.preventDefault();
      setHighlightedIndex(filteredOptions.length - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
    }
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
      data-select-for={selectId}
      style={floatingStyle}
      className={cn(
        shouldRenderPortal ? "fixed z-[150]" : "absolute z-50",
        "bg-card dark:bg-popover border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100",
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
                "w-48 max-w-[calc(100vw-1.5rem)] max-h-60 p-1.5 gap-0.5",
                !shouldRenderPortal &&
                  (align === "right" ? "right-0 left-auto" : "left-0"),
              )
            : cn(
                !shouldRenderPortal && "top-[105%]",
                searchable ? "max-h-80" : "max-h-60",
                !shouldRenderPortal &&
                  (align === "right" ? "right-0 left-auto" : "left-0 w-full"),
              ),
        dropdownClassName,
      )}
    >
      {searchable && !isInline && (
        <search className="p-2 border-b border-neutral-700/80 dark:border-white/10 bg-card dark:bg-popover shrink-0 flex flex-col gap-1.5">
          <div className="relative flex items-center">
            <Search
              size={13}
              className="absolute left-2.5 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                highlightedIndex >= 0
                  ? getOptionId(highlightedIndex)
                  : undefined
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={resolvedSearchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-label={resolvedSearchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-gold/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setHighlightedIndex(-1);
                  searchInputRef.current?.focus();
                }}
                aria-label={t("clearSearchAria")}
                className="absolute right-1.5 p-0.5 text-neutral-400 hover:text-neutral-100 cursor-pointer"
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </div>

          {filterTabs && filterTabs.length > 0 && (
            <fieldset className="flex items-center gap-1 flex-wrap border-0 p-0 m-0">
              {filterTabs.map((tab) => {
                const isTabActive = activeFilterTab === tab.value;
                return (
                  <button
                    key={tab.value || "__all"}
                    type="button"
                    aria-pressed={isTabActive}
                    onClick={() => {
                      setActiveFilterTab(tab.value);
                      setHighlightedIndex(-1);
                      searchInputRef.current?.focus();
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-md border text-tiny font-semibold transition-colors cursor-pointer",
                      isTabActive
                        ? "bg-primary/15 border-primary/40 text-primary dark:bg-gold/15 dark:border-gold/40 dark:text-gold"
                        : "bg-surface/60 border-neutral-700 text-neutral-400 hover:text-neutral-100 dark:bg-white/5 dark:border-white/10",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </fieldset>
          )}
        </search>
      )}

      <div
        id={listboxId}
        role="listbox"
        aria-label={
          ariaLabel || (typeof label === "string" ? label : resolvedPlaceholder)
        }
        onKeyDown={handleListboxKeyDown}
        className="overflow-y-auto custom-scrollbar flex-1"
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
        ) : filteredOptions.length === 0 ? (
          <div className="w-full py-3 px-3 text-xs text-neutral-400 italic text-center select-none">
            {resolvedNoResultsMessage}
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const isSelected = opt.value === currentValue;
            const isHighlighted = highlightedIndex === index;
            return (
              <button
                key={opt.value}
                id={getOptionId(index)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-left cursor-pointer transition-colors flex items-center justify-between gap-2",
                  isInline
                    ? "px-2.5 py-1.5 rounded-lg text-xs"
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
                    : isHighlighted
                      ? "bg-surface-hover text-neutral-50 dark:bg-primary/20 dark:text-neutral-50"
                      : "text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-100 dark:hover:bg-primary/20 dark:hover:text-neutral-50",
                )}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  {opt.icon && (
                    <span className="shrink-0 flex items-center justify-center">
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {(opt.badge || opt.meta) && (
                  <span className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-neutral-700/80 dark:bg-white/5 dark:border-white/10 text-[10px] font-medium text-neutral-300 max-w-[100px] truncate">
                        {opt.badge}
                      </span>
                    )}
                    {opt.meta && (
                      <span className="text-[10px] font-medium text-neutral-400 tabular-nums">
                        {opt.meta}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        isAutoWidth
          ? hasExplicitWidth
            ? "relative block"
            : "relative inline-block"
          : "flex flex-col w-full relative",
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
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "transition-colors flex items-center cursor-pointer select-none",
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
                  hasExplicitWidth && "w-full justify-between",
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
                    ? "border-primary ring-2 ring-primary/15 dark:ring-0 dark:border-primary-light bg-card dark:bg-primary-dark/30 dark:shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary-light)_30%,transparent)]"
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
