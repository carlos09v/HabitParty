"use client";

import { useDroppable } from "@dnd-kit/core";
import { ArchiveRestore, Columns3, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import type { RoutineFiltersProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { BoardAlignmentSelector } from "./filters/BoardAlignmentSelector";
import { RoutineFilterPopover } from "./filters/RoutineFilterPopover";

interface StoreColumnButtonUIProps {
  onOpenColumnsDrawer?: () => void;
  isCompact?: boolean;
  visibleCount: number;
  maxColumns: number;
  isDraggingColumn?: boolean;
  isOver?: boolean;
  setNodeRef?: (element: HTMLElement | null) => void;
}

function StoreColumnButtonUI({
  onOpenColumnsDrawer,
  isCompact,
  visibleCount,
  maxColumns,
  isDraggingColumn = false,
  isOver = false,
  setNodeRef,
}: StoreColumnButtonUIProps) {
  const t = useTranslations("tasks.filters");
  // Apenas considera "isOver" se o elemento arrastado for de fato uma Coluna, nunca um Card de Tarefa
  const isOverValid = isOver && isDraggingColumn;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpenColumnsDrawer}
      title={
        isDraggingColumn
          ? t("storeColumnDropTitle")
          : t("storeColumnManageTitle")
      }
      className={cn(
        "flex items-center gap-1.5 rounded-lg border font-semibold shadow-xs transition-[transform,background-color,border-color,color] cursor-pointer select-none active:scale-98 shrink-0",
        isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
        isOverValid
          ? "bg-amber-500/20 border-amber-500 text-amber-900 dark:bg-gold/25 dark:border-gold dark:text-white ring-2 ring-amber-500/50 dark:ring-gold/70 dark:shadow-glow-gold scale-105"
          : isDraggingColumn
            ? "border-dashed border-amber-500 bg-amber-500/10 text-amber-800 dark:border-gold/70 dark:bg-gold/10 dark:text-gold animate-pulse dark:shadow-glow-gold-xs"
            : "bg-card border-neutral-700 text-neutral-200 hover:border-primary/40 hover:bg-surface hover:text-primary dark:bg-surface dark:border-white/15 dark:text-neutral-200 dark:hover:border-gold/50 dark:hover:bg-surface-hover dark:hover:text-white",
      )}
    >
      {isDraggingColumn ? (
        <ArchiveRestore
          size={isCompact ? 14 : 15}
          className={cn(
            "text-amber-700 dark:text-gold transition-transform",
            isOverValid && "scale-110",
          )}
        />
      ) : (
        <Columns3
          size={isCompact ? 14 : 15}
          className="text-primary dark:text-primary-light"
        />
      )}
      <span>
        {isOverValid
          ? t("dropHere")
          : isDraggingColumn
            ? t("storeDragging")
            : t("columnsLabel")}
      </span>
      <span className="text-primary dark:text-gold font-bold">
        {visibleCount}/{maxColumns}
      </span>
    </button>
  );
}

function DroppableStoreColumnButton(
  props: Omit<StoreColumnButtonUIProps, "isOver" | "setNodeRef">,
) {
  const { setNodeRef, isOver } = useDroppable({
    id: "store-column-button",
    data: { type: "ColumnStoreButton" },
    disabled: !props.isDraggingColumn,
  });

  return (
    <StoreColumnButtonUI {...props} setNodeRef={setNodeRef} isOver={isOver} />
  );
}

export function RoutineFilters({
  search = "",
  onSearch,
  viewMode,
  filters = {
    taskType: "all",
    difficulty: "all",
    priority: "all",
    status: "all",
    tag: null,
  },
  onFilterChange,
  alignment = "left",
  onAlignmentChange,
  availableTags = [],
  onOpenCreateColumn,
  onOpenCreateTask,
  maxColumns = 4,
  isPremium = false,
  canCreateColumn = true,
  visibleColumnIds = [],
  onOpenColumnsDrawer,
  isDraggingColumn = false,
  enableDroppable = false,
  isCompact: propIsCompact,
}: RoutineFiltersProps) {
  const t = useTranslations("tasks.filters");
  const isCompact = propIsCompact ?? false;

  const leftActions = (
    <RoutineFilterPopover
      filters={filters}
      onFilterChange={onFilterChange}
      availableTags={availableTags}
      isCompact={isCompact}
    />
  );

  const rightActions = (
    <>
      {onAlignmentChange && viewMode?.value === "card" && (
        <BoardAlignmentSelector
          value={alignment}
          onChange={onAlignmentChange}
          isCompact={isCompact}
        />
      )}

      {enableDroppable ? (
        <DroppableStoreColumnButton
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          isCompact={isCompact}
          visibleCount={visibleColumnIds.length}
          maxColumns={maxColumns}
          isDraggingColumn={isDraggingColumn}
        />
      ) : (
        <StoreColumnButtonUI
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          isCompact={isCompact}
          visibleCount={visibleColumnIds.length}
          maxColumns={maxColumns}
          isDraggingColumn={isDraggingColumn}
        />
      )}

      <button
        type="button"
        onClick={onOpenCreateColumn}
        disabled={!canCreateColumn}
        title={
          !canCreateColumn
            ? !isPremium
              ? t("newColumnFreeLimitTitle", { max: maxColumns })
              : t("newColumnMaxReachedTitle", { max: maxColumns })
            : t("newColumnCreateTitle")
        }
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-card dark:bg-surface border font-semibold transition-[transform,background-color,border-color,color] shadow-xs shrink-0",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
          canCreateColumn
            ? "border-neutral-700 text-neutral-100 hover:bg-surface hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-neutral-100 dark:hover:bg-surface-hover dark:hover:border-gold dark:hover:text-gold cursor-pointer active:scale-98"
            : "border-neutral-700/60 text-neutral-400 bg-surface dark:border-white/10 dark:text-neutral-500 dark:bg-surface/50 cursor-not-allowed opacity-60",
        )}
      >
        <SquarePlus size={isCompact ? 14 : 16} className="shrink-0" />
        <span className="hidden sm:inline">{t("newColumnButton")}</span>
      </button>

      <PrimaryActionButton
        label={t("newTaskButton")}
        onClick={onOpenCreateTask}
        isCompact={isCompact}
      />
    </>
  );

  return (
    <FilterBar
      search={{
        value: search,
        onChange: (val) => onSearch?.(val),
      }}
      viewMode={viewMode}
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
}
