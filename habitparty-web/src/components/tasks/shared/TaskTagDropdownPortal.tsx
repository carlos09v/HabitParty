"use client";

import { Check, Pencil, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, KeyboardEvent, RefObject } from "react";
import { createPortal } from "react-dom";
import { MAX_TAG_PATH_LENGTH } from "@/constants/task";
import { cn } from "@/utils";
import {
  formatTagBreadcrumb,
  getTagDepth,
  getTagLeafLabel,
  getTagSegments,
} from "@/utils/tags";
import { parseTaskTags } from "@/utils/taskMapper";

export interface SelectedTagChipProps {
  tag: string;
  variant: "popover" | "modal";
  isEditing: boolean;
  editingValue: string;
  editInputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  canUpdate: boolean;
  onEditingValueChange: (val: string) => void;
  onStartEdit: (tag: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onRemoveTag: (tag: string) => void;
}

export function SelectedTagChip({
  tag,
  variant,
  isEditing,
  editingValue,
  editInputRef,
  disabled = false,
  canUpdate,
  onEditingValueChange,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onRemoveTag,
}: SelectedTagChipProps) {
  const t = useTranslations("tasks.tagSelector");
  const tPopover = useTranslations("tasks.detailsPopover.tags");

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gold/70 bg-background/90 max-w-full">
        <input
          ref={editInputRef}
          type="text"
          value={editingValue}
          maxLength={MAX_TAG_PATH_LENGTH}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onEditingValueChange(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              onCommitEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          onBlur={onCommitEdit}
          placeholder={t("editTagPlaceholder")}
          aria-label={t("editTagTitle", { tag })}
          className="w-28 sm:w-32 bg-transparent text-tiny font-medium text-neutral-50 placeholder:text-neutral-500 focus:outline-none min-w-0"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onCommitEdit();
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
            onCancelEdit();
          }}
          aria-label={t("cancelEditTagAria")}
          className="text-neutral-400 hover:text-danger-500 cursor-pointer shrink-0"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  const isPop = variant === "popover";
  return (
    <span
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
      {canUpdate && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit(tag);
          }}
          className="hover:text-gold cursor-pointer opacity-80 sm:opacity-70 sm:group-hover/tag:opacity-100 focus-visible:opacity-100 shrink-0 transition-opacity"
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
        className="hover:text-danger-500 cursor-pointer opacity-80 sm:opacity-70 sm:group-hover/tag:opacity-100 focus-visible:opacity-100 shrink-0 transition-opacity"
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
}

export interface TaskTagDropdownPortalProps {
  popoverRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  listScrollRef: RefObject<HTMLDivElement | null>;
  listboxId: string;
  triggerId: string;
  floatingStyle: CSSProperties;
  shouldRenderPortal: boolean;
  placement?: "top" | "bottom";
  isPopoverVariant: boolean;
  query: string;
  normalizedSearchQuery: string;
  searchLower: string;
  hasIncompleteHierarchy: boolean;
  hasMultiTagDelimiter: boolean;
  canShowCreateRow: boolean;
  isLimitReached: boolean;
  maxTags: number;
  highlightedIndex: number;
  activeDescendantId?: string;
  allHierarchyOptionsCount: number;
  filteredOptions: string[];
  selectedLowerSet: ReadonlySet<string>;
  onQueryChange: (value: string) => void;
  onHighlightIndexChange: (index: number) => void;
  onCompositionEndTime: (timeStamp: number) => void;
  onInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCloseSelector: () => void;
  onCommitTypedInput: () => void;
  onOptionClick: (tag: string) => void;
}

export function TaskTagDropdownPortal({
  popoverRef,
  inputRef,
  listScrollRef,
  listboxId,
  triggerId,
  floatingStyle,
  shouldRenderPortal,
  placement,
  isPopoverVariant,
  query,
  normalizedSearchQuery,
  searchLower,
  hasIncompleteHierarchy,
  hasMultiTagDelimiter,
  canShowCreateRow,
  isLimitReached,
  maxTags,
  highlightedIndex,
  activeDescendantId,
  allHierarchyOptionsCount,
  filteredOptions,
  selectedLowerSet,
  onQueryChange,
  onHighlightIndexChange,
  onCompositionEndTime,
  onInputKeyDown,
  onCloseSelector,
  onCommitTypedInput,
  onOptionClick,
}: TaskTagDropdownPortalProps) {
  const t = useTranslations("tasks.tagSelector");

  const panel = (
    <div
      ref={popoverRef}
      id={listboxId}
      role="listbox"
      data-select-for={triggerId}
      style={floatingStyle}
      className={cn(
        shouldRenderPortal
          ? "fixed z-[160]"
          : "absolute z-50 top-[105%] left-0 w-full",
        "bg-card dark:bg-popover border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden flex flex-col",
        placement === "top"
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
              onQueryChange(e.target.value);
              onHighlightIndexChange(-1);
            }}
            onCompositionEnd={(e) => {
              onCompositionEndTime(e.timeStamp);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={t("searchOrCreatePlaceholder")}
            aria-label={t("searchOrCreatePlaceholder")}
            aria-activedescendant={activeDescendantId}
            className="w-full bg-transparent text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none min-w-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                onHighlightIndexChange(-1);
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
              onClick={onCloseSelector}
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
            onClick={onCommitTypedInput}
            onMouseEnter={() => onHighlightIndexChange(0)}
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
                {allHierarchyOptionsCount === 0
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
                  onClick={() => onOptionClick(tagItem)}
                  onMouseEnter={() => onHighlightIndexChange(optionIndex)}
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

  return shouldRenderPortal ? createPortal(panel, document.body) : panel;
}
