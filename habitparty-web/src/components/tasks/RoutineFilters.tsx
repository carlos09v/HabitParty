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
  visibleCount: number;
  totalCount: number;
  maxColumns: number;
  isDraggingColumn?: boolean;
  isOver?: boolean;
  setNodeRef?: (element: HTMLElement | null) => void;
}

function StoreColumnButtonUI({
  onOpenColumnsDrawer,
  visibleCount,
  totalCount,
  maxColumns,
  isDraggingColumn = false,
  isOver = false,
  setNodeRef,
}: StoreColumnButtonUIProps) {
  const t = useTranslations("tasks.filters");
  // Apenas considera "isOver" se o elemento arrastado for de fato uma Coluna, nunca um Card de Tarefa
  const isOverValid = isOver && isDraggingColumn;
  const hasHiddenColumns = totalCount > visibleCount;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpenColumnsDrawer}
      title={
        isDraggingColumn
          ? t("storeColumnDropTitle")
          : hasHiddenColumns
            ? t("storeColumnManageWithHiddenTitle", {
                total: totalCount,
                visible: visibleCount,
              })
            : t("storeColumnManageTitle")
      }
      className={cn(
        "flex items-center gap-1.5 rounded-lg border font-semibold shadow-xs transition-[transform,background-color,border-color,color] cursor-pointer select-none active:scale-98 shrink-0 px-3 py-2.5 text-body-s",
        isOverValid
          ? "bg-amber-500/20 border-amber-500 text-amber-900 dark:bg-gold/25 dark:border-gold dark:text-white ring-2 ring-amber-500/50 dark:ring-gold/70 dark:shadow-glow-gold scale-105"
          : isDraggingColumn
            ? "border-dashed border-amber-500 bg-amber-500/10 text-amber-800 dark:border-gold/70 dark:bg-gold/10 dark:text-gold animate-pulse dark:shadow-glow-gold-xs"
            : "bg-card border-neutral-700 text-neutral-200 hover:border-primary/40 hover:bg-surface hover:text-primary dark:bg-surface dark:border-white/15 dark:text-neutral-200 dark:hover:border-gold/50 dark:hover:bg-surface-hover dark:hover:text-white",
      )}
    >
      {isDraggingColumn ? (
        <ArchiveRestore
          size={15}
          className={cn(
            "text-amber-700 dark:text-gold transition-transform",
            isOverValid && "scale-110",
          )}
        />
      ) : (
        <Columns3 size={15} className="text-primary dark:text-primary-light" />
      )}
      <span>
        {isOverValid
          ? t("dropHere")
          : isDraggingColumn
            ? t("storeDragging")
            : t("columnsLabel")}
      </span>
      <span className="text-primary dark:text-gold font-bold">
        {totalCount}/{maxColumns}
      </span>
      {hasHiddenColumns && !isDraggingColumn && (
        <span className="rounded bg-surface border border-neutral-700/80 dark:bg-white/10 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-neutral-300">
          {t("visibleCountBadge", { count: visibleCount })}
        </span>
      )}
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
  tagCounts,
  onOpenCreateColumn,
  onOpenCreateTask,
  maxColumns = 4,
  isPremium = false,
  canCreateColumn = true,
  visibleColumnIds = [],
  totalColumnsCount,
  onOpenColumnsDrawer,
  isDraggingColumn = false,
  enableDroppable = false,
}: RoutineFiltersProps) {
  const t = useTranslations("tasks.filters");
  const resolvedTotalCount = totalColumnsCount ?? visibleColumnIds.length;
  const resolvedVisibleCount = Math.min(
    visibleColumnIds.length,
    resolvedTotalCount,
  );

  const leftActions = (
    <RoutineFilterPopover
      filters={filters}
      onFilterChange={onFilterChange}
      availableTags={availableTags}
      tagCounts={tagCounts}
    />
  );

  const rightActions = (
    <>
      {onAlignmentChange && viewMode?.value === "card" && (
        <BoardAlignmentSelector
          value={alignment}
          onChange={onAlignmentChange}
        />
      )}

      {enableDroppable ? (
        <DroppableStoreColumnButton
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          visibleCount={resolvedVisibleCount}
          totalCount={resolvedTotalCount}
          maxColumns={maxColumns}
          isDraggingColumn={isDraggingColumn}
        />
      ) : (
        <StoreColumnButtonUI
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          visibleCount={resolvedVisibleCount}
          totalCount={resolvedTotalCount}
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
          "flex items-center gap-1.5 rounded-lg bg-card dark:bg-surface border font-semibold transition-[transform,background-color,border-color,color] shadow-xs shrink-0 px-3 py-2.5 text-body-s",
          canCreateColumn
            ? "border-neutral-700 text-neutral-100 hover:bg-surface hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-neutral-100 dark:hover:bg-surface-hover dark:hover:border-gold dark:hover:text-gold cursor-pointer active:scale-98"
            : "border-neutral-700/60 text-neutral-400 bg-surface dark:border-white/10 dark:text-neutral-500 dark:bg-surface/50 cursor-not-allowed opacity-60",
        )}
      >
        <SquarePlus size={16} className="shrink-0" />
        <span className="hidden sm:inline">{t("newColumnButton")}</span>
      </button>

      <PrimaryActionButton
        label={t("newTaskButton")}
        onClick={onOpenCreateTask}
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
