"use client";

import { ChevronDown, Plus, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SelectedTagChip,
  TaskTagDropdownPortal,
} from "@/components/tasks/shared/TaskTagDropdownPortal";
import { MAX_TASK_TAGS } from "@/constants/task";
import { useTaskTagSelector } from "@/hooks/useTaskTagSelector";
import { cn } from "@/utils";

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

  const {
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
  } = useTaskTagSelector({
    selectedTags,
    availableTags,
    onAddTag,
    onRemoveTag,
    onUpdateTag,
    onToggleTag,
    variant,
    isOpen: controlledOpen,
    onOpenChange,
    inputValue: controlledInputValue,
    onInputValueChange,
    maxTags,
    disabled,
    id,
  });

  const dropdownPortal = (
    <TaskTagDropdownPortal
      popoverRef={floating.popoverRef}
      inputRef={inputRef}
      listScrollRef={listScrollRef}
      listboxId={listboxId}
      triggerId={triggerId}
      floatingStyle={floating.floatingStyle ?? {}}
      shouldRenderPortal={floating.shouldRenderPortal}
      placement={floating.coords?.placement}
      isPopoverVariant={isPopoverVariant}
      query={query}
      normalizedSearchQuery={normalizedSearchQuery}
      searchLower={searchLower}
      hasIncompleteHierarchy={hasIncompleteHierarchy}
      hasMultiTagDelimiter={hasMultiTagDelimiter}
      canShowCreateRow={canShowCreateRow}
      isLimitReached={isLimitReached}
      maxTags={maxTags}
      highlightedIndex={highlightedIndex}
      activeDescendantId={activeDescendantId}
      allHierarchyOptionsCount={allHierarchyOptions.length}
      filteredOptions={filteredOptions}
      selectedLowerSet={selectedLowerSet}
      onQueryChange={setQuery}
      onHighlightIndexChange={setHighlightedIndex}
      onCompositionEndTime={handleCompositionEndTime}
      onInputKeyDown={handleInputKeyDown}
      onCloseSelector={closeSelector}
      onCommitTypedInput={handleCommitTypedInput}
      onOptionClick={handleOptionClick}
    />
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
          {selectedTags.map((tag) => (
            <SelectedTagChip
              key={tag}
              tag={tag}
              variant="popover"
              isEditing={editingTag === tag}
              editingValue={editingValue}
              editInputRef={editInputRef}
              disabled={disabled}
              canUpdate={Boolean(onUpdateTag)}
              onEditingValueChange={setEditingValue}
              onStartEdit={handleStartEditTag}
              onCommitEdit={handleCommitEditTag}
              onCancelEdit={handleCancelEditTag}
              onRemoveTag={onRemoveTag}
            />
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

        {isOpen && !isLimitReached && dropdownPortal}
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
        onKeyDown={handleTriggerKeyDown}
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
            <SelectedTagChip
              key={tag}
              tag={tag}
              variant="modal"
              isEditing={editingTag === tag}
              editingValue={editingValue}
              editInputRef={editInputRef}
              disabled={disabled}
              canUpdate={Boolean(onUpdateTag)}
              onEditingValueChange={setEditingValue}
              onStartEdit={handleStartEditTag}
              onCommitEdit={handleCommitEditTag}
              onCancelEdit={handleCancelEditTag}
              onRemoveTag={onRemoveTag}
            />
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

      {isOpen && dropdownPortal}
    </div>
  );
}
