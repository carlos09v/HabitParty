"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MAX_TAG_PATH_LENGTH,
  MAX_TASK_TAGS,
  TAG_HIERARCHY_SEPARATOR,
} from "@/constants/task";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import {
  extractAvailableTagOptions,
  getTagSegments,
  hasEmptyTagHierarchyLevel,
  normalizeTagPath,
} from "@/utils/tags";
import { parseTaskTags } from "@/utils/taskMapper";

export interface UseTaskTagSelectorOptions {
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

/**
 * Encapsula estado, filtragem hierarquica, edicao inline, foco e navegacao
 * por teclado do seletor de tags compartilhado.
 */
export function useTaskTagSelector({
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
}: UseTaskTagSelectorOptions) {
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

  const resetQueryState = useCallback(() => {
    setQuery("");
    setHighlightedIndex(-1);
    if (isPopoverVariant) {
      closeSelector();
    }
  }, [setQuery, isPopoverVariant, closeSelector]);

  const handleOptionClick = (tagItem: string) => {
    const isSelected = selectedLowerSet.has(tagItem.toLowerCase());
    if (onToggleTag) {
      onToggleTag(tagItem);
      resetQueryState();
      return;
    }

    if (isSelected) {
      onRemoveTag(tagItem);
    } else {
      onAddTag(tagItem);
    }
    resetQueryState();
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
      resetQueryState();
      return;
    }

    const candidates = parseTaskTags(trimmed);
    if (candidates.length === 0) return;

    if (hasMultiTagDelimiter) {
      onAddTag(candidates.join(", "));
    } else {
      onAddTag(candidates[0]);
    }
    resetQueryState();
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

  const handleArrowHorizontal = (
    e: KeyboardEvent<HTMLInputElement>,
    direction: "left" | "right",
  ) => {
    const highlightedItem =
      highlightedIndex >= 0 ? navItems[highlightedIndex] : undefined;
    const inputEl = e.currentTarget;
    const caretAtEnd =
      inputEl.selectionStart === query.length &&
      inputEl.selectionEnd === query.length;

    if (direction === "right") {
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

    if (highlightedItem?.type === "option") {
      e.preventDefault();
      e.stopPropagation();
      const segments = getTagSegments(highlightedItem.tag);
      setQuery(
        segments.length > 1
          ? segments.slice(0, -1).join(TAG_HIERARCHY_SEPARATOR)
          : "",
      );
      setHighlightedIndex(-1);
      return;
    }

    if (query.includes(">") && (highlightedIndex >= 0 || caretAtEnd)) {
      e.preventDefault();
      e.stopPropagation();
      const trimmedEnd = query.trimEnd();
      if (trimmedEnd.endsWith(">")) {
        setQuery(trimmedEnd.replace(/\s*>\s*$/, ""));
      } else {
        const segments = getTagSegments(query);
        setQuery(
          segments.length > 1
            ? segments.slice(0, -1).join(TAG_HIERARCHY_SEPARATOR)
            : "",
        );
      }
      setHighlightedIndex(-1);
    }
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
      handleArrowHorizontal(e, "right");
      return;
    }

    if (e.key === "ArrowLeft") {
      handleArrowHorizontal(e, "left");
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

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || editingTag) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) openSelector();
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeSelector();
    }
  };

  const handleCompositionEndTime = useCallback((ts: number) => {
    compositionEndTimeRef.current = ts;
  }, []);

  const activeDescendantId =
    highlightedIndex >= 0 && highlightedIndex < navItems.length
      ? `${listboxId}-opt-${highlightedIndex}`
      : undefined;

  return {
    triggerId,
    listboxId,
    floating,
    inputRef,
    editInputRef,
    listScrollRef,
    isOpen,
    isPopoverVariant,
    isLimitReached,
    query,
    setQuery,
    highlightedIndex,
    setHighlightedIndex,
    editingTag,
    editingValue,
    setEditingValue,
    allHierarchyOptions,
    filteredOptions,
    selectedLowerSet,
    normalizedSearchQuery,
    searchLower,
    hasIncompleteHierarchy,
    hasMultiTagDelimiter,
    canShowCreateRow,
    activeDescendantId,
    toggleSelector,
    closeSelector,
    handleOptionClick,
    handleCommitTypedInput,
    handleStartEditTag,
    handleCancelEditTag,
    handleCommitEditTag,
    handleInputKeyDown,
    handleTriggerKeyDown,
    handleCompositionEndTime,
  };
}
