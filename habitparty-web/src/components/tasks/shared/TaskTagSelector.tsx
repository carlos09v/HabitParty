"use client";

import { Check, ChevronDown, Plus, Search, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MAX_TAG_PATH_LENGTH, MAX_TASK_TAGS } from "@/constants/task";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { cn } from "@/utils";
import {
  extractAvailableTagOptions,
  getTagDepth,
  getTagLeafLabel,
  getTagSegments,
  hasEmptyTagHierarchyLevel,
  normalizeTagPath,
} from "@/utils/tags";
import { parseTaskTags } from "@/utils/taskMapper";

export interface TaskTagSelectorProps {
  selectedTags: string[];
  availableTags?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onToggleTag?: (tag: string) => void;
  variant: "popover" | "modal";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  maxTags?: number;
  disabled?: boolean;
  id?: string;
}

function formatTagBreadcrumb(tag: string): string {
  const segments = getTagSegments(tag);
  return segments.length > 0 ? segments.join(" › ") : tag;
}

/**
 * Seletor compartilhado de tags com dropdown pesquisável e suporte a hierarquia estilo TickTick (`Pai > Filho`).
 * Utilizado no popover rápido (TaskDetailsPopover) e no modal completo (TaskBasicFields).
 */
export function TaskTagSelector({
  selectedTags,
  availableTags = [],
  onAddTag,
  onRemoveTag,
  onToggleTag,
  variant,
  isOpen: controlledOpen,
  onOpenChange,
  inputValue: controlledInputValue,
  onInputValueChange,
  maxTags = MAX_TASK_TAGS,
  disabled = false,
  id,
}: TaskTagSelectorProps) {
  const t = useTranslations("tasks.tagSelector");
  const tPopover = useTranslations("tasks.detailsPopover.tags");
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listboxId = `${triggerId}-listbox`;

  const [internalInput, setInternalInput] = useState("");
  const query =
    controlledInputValue !== undefined ? controlledInputValue : internalInput;
  const setQuery = useCallback(
    (next: string) => {
      if (onInputValueChange) {
        onInputValueChange(next);
      } else {
        setInternalInput(next);
      }
    },
    [onInputValueChange],
  );

  const [internalPopoverOpen, setInternalPopoverOpen] = useState(false);
  const isPopoverVariant = variant === "popover";
  const isLimitReached = selectedTags.length >= maxTags;

  const popoverContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const compositionEndTimeRef = useRef(0);

  const floating = useFloatingPopover<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    align: "left",
    estimatedHeight: 240,
    estimatedWidth: 260,
    matchTriggerWidth: true,
    maxAllowedHeight: 260,
    offset: 4,
    disabled: disabled || isPopoverVariant,
    usePortal: true,
    zIndex: 160,
  });

  const isOpen = isPopoverVariant
    ? (controlledOpen ?? internalPopoverOpen)
    : floating.isOpen;

  const closeSelector = useCallback(() => {
    setQuery("");
    if (isPopoverVariant) {
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        setInternalPopoverOpen(false);
      }
    } else {
      floating.close();
    }
  }, [isPopoverVariant, onOpenChange, floating, setQuery]);

  const openSelector = useCallback(() => {
    if (disabled) return;
    if (isPopoverVariant) {
      if (onOpenChange) {
        onOpenChange(true);
      } else {
        setInternalPopoverOpen(true);
      }
    } else if (!floating.isOpen) {
      floating.toggle();
    }
  }, [disabled, isPopoverVariant, onOpenChange, floating]);

  const toggleModalSelector = useCallback(() => {
    if (disabled || isPopoverVariant) return;
    if (floating.isOpen) {
      closeSelector();
    } else {
      floating.toggle();
    }
  }, [disabled, isPopoverVariant, floating, closeSelector]);

  useClickOutside(popoverContainerRef, closeSelector, {
    enabled: isPopoverVariant && isOpen,
    onEscape: closeSelector,
  });

  useEffect(() => {
    if (!isOpen) return;
    const frameId = requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  // Inclui todas as tags existentes no contexto atual além de ancestrais automáticos ("Concurso" para "Concurso > BB")
  const allHierarchyOptions = useMemo(() => {
    return extractAvailableTagOptions([
      { tags: availableTags },
      { tags: selectedTags },
    ]);
  }, [availableTags, selectedTags]);

  const selectedLowerSet = useMemo(
    () =>
      new Set(selectedTags.map((tag) => normalizeTagPath(tag).toLowerCase())),
    [selectedTags],
  );

  const normalizedSearchQuery = normalizeTagPath(query);
  const searchLower = normalizedSearchQuery.toLowerCase();
  const hasIncompleteHierarchy = hasEmptyTagHierarchyLevel(query);

  const filteredOptions = useMemo(() => {
    if (!searchLower) return allHierarchyOptions;
    return allHierarchyOptions.filter((option) =>
      option.toLowerCase().includes(searchLower),
    );
  }, [allHierarchyOptions, searchLower]);

  const exactOptionMatch = useMemo(() => {
    if (!searchLower) return undefined;
    return allHierarchyOptions.find(
      (option) => option.toLowerCase() === searchLower,
    );
  }, [allHierarchyOptions, searchLower]);

  const hasMultiTagDelimiter = /[,;]/.test(query);
  const canShowCreateRow =
    normalizedSearchQuery.length > 0 &&
    !hasIncompleteHierarchy &&
    (hasMultiTagDelimiter || !exactOptionMatch);

  const handleOptionClick = (tagItem: string) => {
    const isSelected = selectedLowerSet.has(tagItem.toLowerCase());
    if (onToggleTag) {
      onToggleTag(tagItem);
      setQuery("");
      if (isPopoverVariant) {
        closeSelector();
      }
      return;
    }

    if (isSelected) {
      onRemoveTag(tagItem);
    } else {
      onAddTag(tagItem);
    }
    setQuery("");
    if (isPopoverVariant) {
      closeSelector();
    }
  };

  const handleCommitTypedInput = () => {
    const trimmed = query.trim();
    if (!trimmed || hasIncompleteHierarchy) return;

    if (!hasMultiTagDelimiter && exactOptionMatch) {
      const isAlreadySelected = selectedLowerSet.has(
        exactOptionMatch.toLowerCase(),
      );
      if (!isAlreadySelected) {
        onAddTag(exactOptionMatch);
      }
      setQuery("");
      if (isPopoverVariant) {
        closeSelector();
      }
      return;
    }

    const candidates = parseTaskTags(trimmed);
    if (candidates.length === 0) return;

    if (hasMultiTagDelimiter) {
      onAddTag(candidates.join(", "));
    } else {
      onAddTag(candidates[0]);
    }
    setQuery("");
    if (isPopoverVariant) {
      closeSelector();
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeSelector();
      return;
    }

    if (e.key === "Enter") {
      if (
        e.nativeEvent.isComposing ||
        e.timeStamp - compositionEndTimeRef.current < 100
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      handleCommitTypedInput();
    }
  };

  const renderDropdownPanel = (isFloatingPortal: boolean) => (
    <div
      ref={isFloatingPortal ? floating.popoverRef : undefined}
      id={listboxId}
      role="listbox"
      data-select-for={isFloatingPortal ? triggerId : undefined}
      style={isFloatingPortal ? floating.floatingStyle : undefined}
      className={cn(
        isFloatingPortal
          ? floating.shouldRenderPortal
            ? "fixed z-[160]"
            : "absolute z-50 top-[105%] left-0 w-full"
          : "w-full mt-1",
        "bg-card dark:bg-popover border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden flex flex-col",
        isFloatingPortal &&
          (floating.coords?.placement === "top"
            ? "origin-bottom animate-in fade-in zoom-in-95 duration-100"
            : "origin-top animate-in fade-in zoom-in-95 duration-100"),
      )}
    >
      {/* Barra fixa de busca / criação */}
      <div className="p-2 border-b border-white/10 flex flex-col gap-1 shrink-0 bg-card/80 dark:bg-popover/90">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/60 border border-primary/35 focus-within:border-gold">
          <Search size={12} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            maxLength={MAX_TAG_PATH_LENGTH}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionEnd={(e) => {
              compositionEndTimeRef.current = e.timeStamp;
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t("searchOrCreatePlaceholder")}
            aria-label={t("searchOrCreatePlaceholder")}
            className="w-full bg-transparent text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-neutral-400 hover:text-neutral-200 cursor-pointer shrink-0"
              aria-label={t("clearSearchAria")}
            >
              <X size={12} />
            </button>
          )}
          {isPopoverVariant && (
            <button
              type="button"
              onClick={closeSelector}
              className="text-neutral-400 hover:text-gold cursor-pointer shrink-0 pl-1 border-l border-white/10"
              aria-label={t("closeSelectorAria")}
            >
              <X size={12} />
            </button>
          )}
        </div>
        {hasIncompleteHierarchy ? (
          <span className="text-label-s text-amber-400 px-0.5">
            {t("incompleteHierarchyWarning")}
          </span>
        ) : (
          <span className="text-label-s text-neutral-400 px-0.5">
            {t("nestingHint")}
          </span>
        )}
      </div>

      {/* Lista rolável de tags existentes + criação */}
      <div className="max-h-44 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5">
        {canShowCreateRow && (
          <button
            type="button"
            onClick={handleCommitTypedInput}
            disabled={isLimitReached}
            className={cn(
              "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer",
              isLimitReached
                ? "opacity-50 cursor-not-allowed text-neutral-500"
                : "text-gold bg-gold/10 hover:bg-gold/20 font-medium",
            )}
          >
            <Plus size={13} className="shrink-0" />
            <span className="truncate">
              {t("createTagOption", {
                tag: hasMultiTagDelimiter
                  ? parseTaskTags(query).join(", ")
                  : normalizedSearchQuery,
              })}
            </span>
          </button>
        )}

        {filteredOptions.length === 0
          ? !canShowCreateRow && (
              <div className="px-2.5 py-2 text-xs text-neutral-400 italic select-none">
                {allHierarchyOptions.length === 0
                  ? t("emptyNoTags")
                  : t("emptyNoMatches")}
              </div>
            )
          : filteredOptions.map((tagItem) => {
              const isSelected = selectedLowerSet.has(tagItem.toLowerCase());
              const depth = getTagDepth(tagItem);
              const segments = getTagSegments(tagItem);
              const leafLabel = getTagLeafLabel(tagItem);
              const parentBreadcrumb =
                searchLower && segments.length > 1
                  ? `${segments.slice(0, -1).join(" › ")} › `
                  : null;
              const optionDisabled = !isSelected && isLimitReached;

              return (
                <button
                  key={tagItem}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={optionDisabled}
                  title={
                    optionDisabled
                      ? t("maxTagsReached", { max: maxTags })
                      : tagItem
                  }
                  onClick={() => handleOptionClick(tagItem)}
                  style={{
                    paddingLeft: `${10 + (searchLower ? 0 : depth * 14)}px`,
                  }}
                  className={cn(
                    "w-full text-left pr-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors",
                    optionDisabled
                      ? "opacity-45 cursor-not-allowed text-neutral-500"
                      : "cursor-pointer",
                    isSelected
                      ? "bg-primary/15 text-primary dark:bg-primary/20 dark:text-gold font-semibold"
                      : !optionDisabled &&
                          "text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-100 dark:hover:bg-primary/20",
                  )}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "shrink-0",
                        isSelected ? "text-gold" : "text-neutral-500",
                      )}
                    >
                      {!searchLower && depth > 0 ? "↳" : "#"}
                    </span>
                    <span className="truncate">
                      {parentBreadcrumb && (
                        <span className="text-neutral-400 font-normal">
                          {parentBreadcrumb}
                        </span>
                      )}
                      {leafLabel}
                    </span>
                  </span>
                  {isSelected && (
                    <Check size={13} className="shrink-0 text-gold" />
                  )}
                </button>
              );
            })}
      </div>
    </div>
  );

  if (isPopoverVariant) {
    return (
      <div
        ref={popoverContainerRef}
        className="flex flex-col gap-1 w-full min-w-0"
      >
        <div className="flex items-center gap-1.5 flex-wrap min-h-6">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-semibold bg-success-500/15 border border-success-500/30 text-success-500 group/tag max-w-full"
            >
              <span className="max-w-[160px] truncate" title={tag}>
                {formatTagBreadcrumb(tag)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-danger-500 cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                title={tPopover("removeTagTitle", { tag })}
              >
                <X size={10} />
              </button>
            </span>
          ))}

          {isLimitReached ? (
            <span
              title={tPopover("maxTagsTitle", { max: maxTags })}
              className="text-tiny text-neutral-500 italic px-1 select-none"
            >
              {tPopover("maxTagsLabel", { max: maxTags })}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => (isOpen ? closeSelector() : openSelector())}
              aria-expanded={isOpen}
              aria-controls={listboxId}
              title={tPopover("addTagTitle", {
                current: selectedTags.length,
                max: maxTags,
              })}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded border text-tiny transition-colors cursor-pointer",
                isOpen
                  ? "bg-gold/15 border-gold/50 text-gold"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:text-gold hover:border-gold/40",
              )}
            >
              <Plus size={10} />
              <span>{tPopover("addTagButton")}</span>
            </button>
          )}
        </div>

        {isOpen && !isLimitReached && renderDropdownPanel(false)}
      </div>
    );
  }

  return (
    <div ref={floating.containerRef} className="relative w-full">
      <div
        ref={floating.triggerRef}
        id={triggerId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleModalSelector}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            if (!isOpen) openSelector();
          } else if (e.key === "Escape" && isOpen) {
            e.preventDefault();
            e.stopPropagation();
            closeSelector();
          }
        }}
        className={cn(
          "w-full rounded-lg text-left transition-colors py-1.5 pl-8 pr-8 min-h-[38px] relative flex items-center flex-wrap gap-1",
          "bg-card border border-neutral-600 hover:border-neutral-500 text-neutral-50 shadow-xs",
          "dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none",
          isOpen &&
            "border-primary ring-2 ring-primary/15 dark:border-gold dark:ring-1 dark:ring-gold",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <Tag
          size={15}
          className="absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none shrink-0"
        />

        {selectedTags.length === 0 ? (
          <span className="text-body-s text-neutral-400 dark:text-neutral-500 truncate select-none">
            {t("selectOrCreatePlaceholder")}
          </span>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-tiny font-medium bg-primary/15 border border-primary/30 text-neutral-100 max-w-full"
            >
              <span className="truncate max-w-[130px]" title={tag}>
                {formatTagBreadcrumb(tag)}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(tag);
                }}
                className="text-neutral-400 hover:text-danger-400 cursor-pointer shrink-0"
                title={t("removeTagTitle", { tag })}
                aria-label={t("removeTagTitle", { tag })}
              >
                <X size={11} />
              </button>
            </span>
          ))
        )}

        <ChevronDown
          size={15}
          className={cn(
            "absolute right-2.5 top-2.5 text-neutral-400 pointer-events-none transition-transform duration-150",
            isOpen && "rotate-180 text-gold",
          )}
        />
      </div>

      {isOpen &&
        (floating.shouldRenderPortal
          ? createPortal(renderDropdownPanel(true), document.body)
          : renderDropdownPanel(true))}
    </div>
  );
}
