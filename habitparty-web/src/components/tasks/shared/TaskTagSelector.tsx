"use client";

import { Check, ChevronDown, Pencil, Plus, Search, Tag, X } from "lucide-react";
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
import {
  MAX_TAG_PATH_LENGTH,
  MAX_TASK_TAGS,
  TAG_HIERARCHY_SEPARATOR,
} from "@/constants/task";
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
  onUpdateTag?: (oldTag: string, newTag: string) => void;
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

type DropdownNavItem = { type: "create" } | { type: "option"; tag: string };

function formatTagBreadcrumb(tag: string): string {
  const segments = getTagSegments(tag);
  return segments.length > 0 ? segments.join(" › ") : tag;
}

/**
 * Seletor compartilhado de tags com dropdown flutuante pesquisável, edição inline,
 * navegação por teclado (↑/↓, →/← hierárquico) e suporte a hierarquia estilo TickTick (`Pai > Filho`).
 * Utilizado no popover rápido (TaskDetailsPopover) e no modal completo (TaskBasicFields).
 */
export function TaskTagSelector({
  selectedTags,
  availableTags = [],
  onAddTag,
  onRemoveTag,
  onUpdateTag,
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

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editCancelledRef = useRef(false);

  const isPopoverVariant = variant === "popover";
  const isLimitReached = selectedTags.length >= maxTags;

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const compositionEndTimeRef = useRef(0);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const handleFloatingClose = useCallback(() => {
    setQuery("");
    setHighlightedIndex(-1);
    onOpenChangeRef.current?.(false);
  }, [setQuery]);

  const floating = useFloatingPopover<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    align: "left",
    estimatedHeight: 240,
    estimatedWidth: 280,
    matchTriggerWidth: true,
    maxAllowedHeight: 260,
    offset: 4,
    disabled,
    usePortal: true,
    zIndex: 160,
    onClose: handleFloatingClose,
  });

  const isOpen = floating.isOpen;

  const prevControlledOpenRef = useRef(controlledOpen);
  useEffect(() => {
    if (controlledOpen === undefined) return;
    if (prevControlledOpenRef.current !== controlledOpen) {
      prevControlledOpenRef.current = controlledOpen;
      if (controlledOpen && !floating.isOpen && !disabled && !isLimitReached) {
        floating.open();
      } else if (!controlledOpen && floating.isOpen) {
        floating.close();
      }
    }
  }, [controlledOpen, floating, disabled, isLimitReached]);

  const closeSelector = useCallback(() => {
    floating.close();
  }, [floating]);

  const openSelector = useCallback(() => {
    if (disabled || (isPopoverVariant && isLimitReached)) return;
    if (!floating.isOpen) {
      floating.open();
      onOpenChangeRef.current?.(true);
    }
  }, [disabled, isPopoverVariant, isLimitReached, floating]);

  const toggleSelector = useCallback(() => {
    if (disabled) return;
    if (floating.isOpen) {
      closeSelector();
    } else {
      openSelector();
    }
  }, [disabled, floating.isOpen, closeSelector, openSelector]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    const frameId = requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  useEffect(() => {
    if (!editingTag) return;
    const frameId = requestAnimationFrame(() => {
      editInputRef.current?.focus({ preventScroll: true });
      editInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frameId);
  }, [editingTag]);

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

  const navItems = useMemo<DropdownNavItem[]>(() => {
    const items: DropdownNavItem[] = [];
    if (canShowCreateRow && !isLimitReached) {
      items.push({ type: "create" });
    }
    for (const tag of filteredOptions) {
      items.push({ type: "option", tag });
    }
    return items;
  }, [canShowCreateRow, isLimitReached, filteredOptions]);

  const scrollOptionIntoView = useCallback((index: number) => {
    requestAnimationFrame(() => {
      const target = listScrollRef.current?.querySelector<HTMLElement>(
        `[data-option-index="${index}"]`,
      );
      target?.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const handleOptionClick = (tagItem: string) => {
    const isSelected = selectedLowerSet.has(tagItem.toLowerCase());
    if (onToggleTag) {
      onToggleTag(tagItem);
      setQuery("");
      setHighlightedIndex(-1);
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
    setHighlightedIndex(-1);
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
      setHighlightedIndex(-1);
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
    setHighlightedIndex(-1);
    if (isPopoverVariant) {
      closeSelector();
    }
  };

  const handleStartEditTag = (tag: string) => {
    if (disabled || !onUpdateTag) return;
    if (isOpen) {
      closeSelector();
    }
    editCancelledRef.current = false;
    setEditingTag(tag);
    setEditingValue(tag);
  };

  const handleCancelEditTag = () => {
    editCancelledRef.current = true;
    setEditingTag(null);
    setEditingValue("");
  };

  const handleCommitEditTag = () => {
    if (editCancelledRef.current || !editingTag) {
      editCancelledRef.current = false;
      setEditingTag(null);
      setEditingValue("");
      return;
    }
    const oldTag = editingTag;
    const rawValue = editingValue;
    setEditingTag(null);
    setEditingValue("");

    if (!rawValue.trim() || hasEmptyTagHierarchyLevel(rawValue)) {
      return;
    }
    const normalized = normalizeTagPath(rawValue);
    if (!normalized || normalized === oldTag) {
      return;
    }
    onUpdateTag?.(oldTag, normalized);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeSelector();
      return;
    }

    if (e.key === "ArrowDown") {
      if (navItems.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        const next = prev < navItems.length - 1 ? prev + 1 : 0;
        scrollOptionIntoView(next);
        return next;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      if (navItems.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : navItems.length - 1;
        scrollOptionIntoView(next);
        return next;
      });
      return;
    }

    if (e.key === "ArrowRight") {
      const highlightedItem =
        highlightedIndex >= 0 ? navItems[highlightedIndex] : undefined;
      const inputEl = e.currentTarget;
      const caretAtEnd =
        inputEl.selectionStart === query.length &&
        inputEl.selectionEnd === query.length;
      const trimmedEnd = query.trimEnd();
      const targetTag =
        highlightedItem?.type === "option"
          ? highlightedItem.tag
          : caretAtEnd && !trimmedEnd.endsWith(">")
            ? (exactOptionMatch ??
              (query === "" ? filteredOptions[0] : undefined))
            : undefined;

      if (targetTag) {
        const completed = `${targetTag}${TAG_HIERARCHY_SEPARATOR}`;
        if (completed.length <= MAX_TAG_PATH_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          setQuery(completed);
          setHighlightedIndex(-1);
        }
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      const highlightedItem =
        highlightedIndex >= 0 ? navItems[highlightedIndex] : undefined;
      const inputEl = e.currentTarget;
      const caretAtEnd =
        inputEl.selectionStart === query.length &&
        inputEl.selectionEnd === query.length;

      if (highlightedItem?.type === "option") {
        e.preventDefault();
        e.stopPropagation();
        const segments = getTagSegments(highlightedItem.tag);
        if (segments.length > 1) {
          setQuery(segments.slice(0, -1).join(TAG_HIERARCHY_SEPARATOR));
        } else {
          setQuery("");
        }
        setHighlightedIndex(-1);
        return;
      }

      if (query.includes(">") && (highlightedIndex >= 0 || caretAtEnd)) {
        e.preventDefault();
        e.stopPropagation();
        const trimmedEnd = query.trimEnd();
        if (trimmedEnd.endsWith(">")) {
          // Remove apenas o separador pendente no fim (ex: "Concurso > " -> "Concurso")
          const withoutTrailingArrow = trimmedEnd.replace(/\s*>\s*$/, "");
          setQuery(withoutTrailingArrow);
        } else {
          const segments = getTagSegments(query);
          if (segments.length > 1) {
            setQuery(segments.slice(0, -1).join(TAG_HIERARCHY_SEPARATOR));
          } else {
            setQuery("");
          }
        }
        setHighlightedIndex(-1);
      }
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

      const highlightedItem =
        highlightedIndex >= 0 ? navItems[highlightedIndex] : undefined;
      if (highlightedItem?.type === "option") {
        const isSelected = selectedLowerSet.has(
          highlightedItem.tag.toLowerCase(),
        );
        const optionDisabled = !isSelected && isLimitReached;
        if (!optionDisabled) {
          handleOptionClick(highlightedItem.tag);
        }
        return;
      }
      handleCommitTypedInput();
    }
  };

  const activeDescendantId =
    highlightedIndex >= 0 && highlightedIndex < navItems.length
      ? `${listboxId}-opt-${highlightedIndex}`
      : undefined;

  const renderSelectedTagChip = (
    tag: string,
    chipVariant: "popover" | "modal",
  ) => {
    const isEditingThis = editingTag === tag;
    if (isEditingThis) {
      return (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gold/70 bg-background/90 max-w-full"
        >
          <input
            ref={editInputRef}
            type="text"
            value={editingValue}
            maxLength={MAX_TAG_PATH_LENGTH}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                handleCommitEditTag();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleCancelEditTag();
              }
            }}
            onBlur={handleCommitEditTag}
            placeholder={t("editTagPlaceholder")}
            aria-label={t("editTagTitle", { tag })}
            className="w-28 sm:w-32 bg-transparent text-tiny font-medium text-neutral-50 placeholder:text-neutral-500 focus:outline-none min-w-0"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleCommitEditTag();
            }}
            aria-label={t("saveTagAria")}
            className="text-gold hover:text-gold-hover cursor-pointer shrink-0"
          >
            <Check size={10} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              handleCancelEditTag();
            }}
            aria-label={t("cancelEditTagAria")}
            className="text-neutral-400 hover:text-danger-500 cursor-pointer shrink-0"
          >
            <X size={10} />
          </button>
        </span>
      );
    }

    const isPop = chipVariant === "popover";
    return (
      <span
        key={tag}
        className={cn(
          "inline-flex items-center gap-1 rounded text-tiny max-w-full group/tag",
          isPop
            ? "px-2 py-0.5 font-semibold bg-success-500/15 border border-success-500/30 text-success-500"
            : "px-1.5 py-0.5 font-medium bg-primary/15 border border-primary/30 text-neutral-100",
        )}
      >
        <span
          className={cn("truncate", isPop ? "max-w-[150px]" : "max-w-[120px]")}
          title={tag}
        >
          {formatTagBreadcrumb(tag)}
        </span>
        {onUpdateTag && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartEditTag(tag);
            }}
            className="hover:text-gold cursor-pointer opacity-70 hover:opacity-100 shrink-0 transition-opacity"
            title={t("editTagTitle", { tag })}
            aria-label={t("editTagTitle", { tag })}
          >
            <Pencil size={isPop ? 9 : 10} />
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveTag(tag);
          }}
          className="hover:text-danger-500 cursor-pointer opacity-70 hover:opacity-100 shrink-0 transition-opacity"
          title={
            isPop
              ? tPopover("removeTagTitle", { tag })
              : t("removeTagTitle", { tag })
          }
          aria-label={
            isPop
              ? tPopover("removeTagTitle", { tag })
              : t("removeTagTitle", { tag })
          }
        >
          <X size={isPop ? 10 : 11} />
        </button>
      </span>
    );
  };

  const renderDropdownPanel = () => (
    <div
      ref={floating.popoverRef}
      id={listboxId}
      role="listbox"
      data-select-for={triggerId}
      style={floating.floatingStyle}
      className={cn(
        floating.shouldRenderPortal
          ? "fixed z-[160]"
          : "absolute z-50 top-[105%] left-0 w-full",
        "bg-card dark:bg-popover border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden flex flex-col",
        floating.coords?.placement === "top"
          ? "origin-bottom animate-in fade-in zoom-in-95 duration-100"
          : "origin-top animate-in fade-in zoom-in-95 duration-100",
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
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            onCompositionEnd={(e) => {
              compositionEndTimeRef.current = e.timeStamp;
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t("searchOrCreatePlaceholder")}
            aria-label={t("searchOrCreatePlaceholder")}
            aria-activedescendant={activeDescendantId}
            className="w-full bg-transparent text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setHighlightedIndex(-1);
              }}
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
      <div
        ref={listScrollRef}
        className="max-h-44 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5"
      >
        {canShowCreateRow && (
          <button
            id={`${listboxId}-opt-0`}
            data-option-index={0}
            type="button"
            role="option"
            aria-selected={highlightedIndex === 0}
            onClick={handleCommitTypedInput}
            onMouseEnter={() => setHighlightedIndex(0)}
            disabled={isLimitReached}
            className={cn(
              "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer",
              isLimitReached
                ? "opacity-50 cursor-not-allowed text-neutral-500"
                : highlightedIndex === 0
                  ? "text-gold bg-gold/25 ring-1 ring-gold/50 font-medium"
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
          : filteredOptions.map((tagItem, idx) => {
              const optionIndex =
                canShowCreateRow && !isLimitReached ? idx + 1 : idx;
              const isHighlighted = highlightedIndex === optionIndex;
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
                  id={`${listboxId}-opt-${optionIndex}`}
                  data-option-index={optionIndex}
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
                  onMouseEnter={() => setHighlightedIndex(optionIndex)}
                  style={{
                    paddingLeft: `${10 + (searchLower ? 0 : depth * 14)}px`,
                  }}
                  className={cn(
                    "w-full text-left pr-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors",
                    optionDisabled
                      ? "opacity-45 cursor-not-allowed text-neutral-500"
                      : "cursor-pointer",
                    isHighlighted
                      ? "bg-primary/25 text-primary dark:bg-gold/18 dark:text-gold ring-1 ring-primary/40 dark:ring-gold/40 font-semibold"
                      : isSelected
                        ? "bg-primary/15 text-primary dark:bg-primary/20 dark:text-gold font-semibold"
                        : !optionDisabled &&
                          "text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-100 dark:hover:bg-primary/20",
                  )}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "shrink-0",
                        isSelected || isHighlighted
                          ? "text-gold"
                          : "text-neutral-500",
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
        ref={floating.containerRef}
        className="relative flex flex-col gap-1 w-full min-w-0"
      >
        <div
          ref={floating.triggerRef}
          id={triggerId}
          className="flex items-center gap-1.5 flex-wrap min-h-6"
        >
          {selectedTags.map((tag) => renderSelectedTagChip(tag, "popover"))}

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
              onClick={toggleSelector}
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

        {isOpen &&
          !isLimitReached &&
          (floating.shouldRenderPortal
            ? createPortal(renderDropdownPanel(), document.body)
            : renderDropdownPanel())}
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
        onClick={toggleSelector}
        onKeyDown={(e) => {
          if (disabled || editingTag) return;
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
          selectedTags.map((tag) => renderSelectedTagChip(tag, "modal"))
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
          ? createPortal(renderDropdownPanel(), document.body)
          : renderDropdownPanel())}
    </div>
  );
}
