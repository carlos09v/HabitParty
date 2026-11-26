"use client";

import {
  Calendar,
  Crown,
  EyeOff,
  FilterX,
  Layers,
  Lock,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useId, useMemo, useRef } from "react";
import { TaskAdvancedFilterPopover } from "@/components/dashboard/filters/TaskAdvancedFilterPopover";
import { Select } from "@/components/ui/Select";
import {
  DASHBOARD_TASK_FILTERS,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
} from "@/constants/dashboard";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { TaskFiltersProps } from "@/types/dashboard";
import type { TaskFilterType } from "@/types/task";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";

export function TaskFilters({
  activeFilter = "today",
  onFilterChange,
  selectedDate,
  onClearDate,
  searchQuery = "",
  onSearchQueryChange,
  columns = [],
  workspaces = [],
  availableTags = [],
  tagCounts = {},
  advancedFilters = DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  onAdvancedFiltersChange,
  onClearAllFilters,
  onCreateTask,
  canCreateTask = true,
  createTaskDisabledReason,
  overdueCount = 0,
  timeZone,
}: TaskFiltersProps) {
  const t = useTranslations("dashboard.taskFilters");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { isGamified } = useExperienceMode();
  const userTimeZone = useUserStore((s) => s.user?.timezone) ?? timeZone;
  const hasMultipleWorkspaces = workspaces.length > 1;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const advancedPopoverId = useId();
  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen: showPopover,
    toggle: togglePopover,
    coords,
    shouldRenderPortal,
    portalContainer,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedHeight: 320,
    estimatedWidth: 420,
    maxAllowedHeight: 440,
    offset: 8,
    margin: 12,
    zIndex: 130,
    restoreFocusOnEscape: true,
  });

  // Conta os 6 controles que vivem dentro do popover avançado
  const activeFiltersCount = useMemo(() => {
    return (
      (advancedFilters.taskType !== "all" ? 1 : 0) +
      (advancedFilters.columnId !== "all" ? 1 : 0) +
      (advancedFilters.difficulty !== "all" ? 1 : 0) +
      (advancedFilters.priority !== "all" ? 1 : 0) +
      (advancedFilters.tag !== null ? 1 : 0) +
      (advancedFilters.sortBy !== "default" ? 1 : 0)
    );
  }, [advancedFilters]);

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return null;
    return formatShortDate(selectedDate, {
      monthFormat: "short",
      locale,
      dateFormat,
      timeZone: userTimeZone,
    });
  }, [selectedDate, locale, dateFormat, userTimeZone]);

  const workspaceSelectOptions = useMemo(
    () => [
      { value: "", label: t("allWorkspaces") },
      ...workspaces
        .filter((ws): ws is typeof ws & { id: string } => Boolean(ws.id))
        .map((ws) => {
          const baseName = ws.name || t("untitledWorkspace");
          return {
            value: ws.id,
            label: ws.isReadOnly
              ? `${baseName} ${t("readOnlyWorkspaceSuffix")}`
              : baseName,
            icon: ws.isReadOnly ? (
              <Lock size={12} className="text-neutral-400" aria-hidden="true" />
            ) : undefined,
          };
        }),
    ],
    [workspaces, t],
  );

  const columnOptions = useMemo(() => {
    const opts = [{ value: "all", label: t("allColumns") }];
    const scopedColumns =
      advancedFilters.workspaceId === "all"
        ? columns
        : columns.filter((c) => c.workspaceId === advancedFilters.workspaceId);

    for (const c of scopedColumns) {
      if (c.id) {
        const baseName = c.name || t("untitledColumn");
        const label =
          advancedFilters.workspaceId === "all" &&
          hasMultipleWorkspaces &&
          c.workspaceName
            ? `${baseName} (${c.workspaceName})`
            : baseName;
        opts.push({ value: c.id, label });
      }
    }
    return opts;
  }, [columns, advancedFilters.workspaceId, hasMultipleWorkspaces, t]);

  const taskTypeOptions = useMemo(
    () => [
      { value: "all", label: t("allTypes") },
      { value: "HABIT", label: t("habits") },
      { value: "DAILY", label: t("dailies") },
      { value: "TODO", label: t("todos") },
    ],
    [t],
  );

  const difficultyOptions = useMemo(
    () => [
      { value: "all", label: t("allDifficulties") },
      { value: "TRIVIAL", label: t("trivial") },
      { value: "EASY", label: t("easy") },
      { value: "MEDIUM", label: t("medium") },
      { value: "HARD", label: t("hard") },
    ],
    [t],
  );

  const priorityOptions = useMemo(
    () => [
      { value: "all", label: t("allPriorities") },
      { value: "HIGH", label: t("priorityHigh") },
      { value: "MEDIUM", label: t("priorityMedium") },
      { value: "LOW", label: t("priorityLow") },
      { value: "NONE", label: t("priorityNone") },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "default", label: t("sortDefault") },
      { value: "dueDate", label: t("sortDueDate") },
      { value: "difficulty", label: t("sortDifficulty") },
      { value: "priority", label: t("sortPriority") },
      { value: "reward", label: t("sortReward") },
    ],
    [t],
  );

  const handleSelectStandardFilter = (id: TaskFilterType) => {
    onFilterChange?.(id);
  };

  const handleClearDateWithFocus = () => {
    onClearDate?.();
    const targetIdx = Math.max(
      0,
      DASHBOARD_TASK_FILTERS.findIndex((f) => f.id === activeFilter),
    );
    window.requestAnimationFrame(() => {
      tabRefs.current[targetIdx]?.focus();
    });
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const total = DASHBOARD_TASK_FILTERS.length;
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % total;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = total - 1;
    }
    if (nextIndex === null) return;
    e.preventDefault();
    const targetFilter = DASHBOARD_TASK_FILTERS[nextIndex];
    handleSelectStandardFilter(targetFilter.id);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleResetAdvanced = () => {
    onAdvancedFiltersChange?.({
      ...advancedFilters,
      taskType: "all",
      columnId: "all",
      difficulty: "all",
      priority: "all",
      tag: null,
      sortBy: "default",
    });
  };

  const handleWorkspaceChange = useCallback(
    (workspaceId: string) => {
      const keepColumn =
        workspaceId === "all" ||
        columns.some(
          (c) =>
            c.id === advancedFilters.columnId && c.workspaceId === workspaceId,
        );
      onAdvancedFiltersChange?.({
        ...advancedFilters,
        workspaceId,
        columnId: keepColumn ? advancedFilters.columnId : "all",
      });
    },
    [columns, advancedFilters, onAdvancedFiltersChange],
  );

  const handleToggleQuickHideCompleted = () => {
    onAdvancedFiltersChange?.({
      ...advancedFilters,
      hideCompleted: !advancedFilters.hideCompleted,
    });
  };

  const activeChips = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];

    if (hasMultipleWorkspaces && advancedFilters.workspaceId !== "all") {
      const wsName =
        workspaces.find((w) => w.id === advancedFilters.workspaceId)?.name ||
        t("untitledWorkspace");
      chips.push({
        key: "workspace",
        label: t("workspaceLabel"),
        value: wsName,
        onRemove: () => handleWorkspaceChange("all"),
      });
    }

    if (advancedFilters.columnId !== "all") {
      const colName =
        columns.find((c) => c.id === advancedFilters.columnId)?.name ||
        t("untitledColumn");
      chips.push({
        key: "column",
        label: t("columnLabel"),
        value: colName,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, columnId: "all" }),
      });
    }

    if (advancedFilters.taskType !== "all") {
      const typeLabel =
        taskTypeOptions.find((o) => o.value === advancedFilters.taskType)
          ?.label ?? advancedFilters.taskType;
      chips.push({
        key: "taskType",
        label: t("taskTypeLabel"),
        value: typeLabel,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, taskType: "all" }),
      });
    }

    if (advancedFilters.difficulty !== "all") {
      const diffLabel =
        difficultyOptions.find((o) => o.value === advancedFilters.difficulty)
          ?.label ?? advancedFilters.difficulty;
      chips.push({
        key: "difficulty",
        label: isGamified ? t("difficultyLabel") : t("effortLabel"),
        value: diffLabel,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, difficulty: "all" }),
      });
    }

    if (advancedFilters.priority !== "all") {
      const priorityLabel =
        priorityOptions.find((o) => o.value === advancedFilters.priority)
          ?.label ?? advancedFilters.priority;
      chips.push({
        key: "priority",
        label: t("priorityLabel"),
        value: priorityLabel,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, priority: "all" }),
      });
    }

    if (advancedFilters.tag !== null) {
      chips.push({
        key: "tag",
        label: t("tagLabel"),
        value: `#${advancedFilters.tag}`,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, tag: null }),
      });
    }

    if (advancedFilters.hideCompleted) {
      chips.push({
        key: "hideCompleted",
        label: t("quickHideCompleted"),
        value: t("hideCompletedChip"),
        onRemove: () =>
          onAdvancedFiltersChange?.({
            ...advancedFilters,
            hideCompleted: false,
          }),
      });
    }

    if (advancedFilters.sortBy !== "default") {
      const sortLabel =
        sortOptions.find((o) => o.value === advancedFilters.sortBy)?.label ??
        advancedFilters.sortBy;
      chips.push({
        key: "sortBy",
        label: t("sortByLabel"),
        value: sortLabel,
        onRemove: () =>
          onAdvancedFiltersChange?.({ ...advancedFilters, sortBy: "default" }),
      });
    }

    return chips;
  }, [
    hasMultipleWorkspaces,
    advancedFilters,
    workspaces,
    columns,
    taskTypeOptions,
    difficultyOptions,
    priorityOptions,
    sortOptions,
    isGamified,
    handleWorkspaceChange,
    onAdvancedFiltersChange,
    t,
  ]);

  return (
    <div className="w-full relative flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2.5 w-full flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar px-1 py-1 -mx-1 min-w-0">
          {selectedDate && (
            <button
              type="button"
              id="chip-date"
              onClick={handleClearDateWithFocus}
              className="flex items-center gap-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer shadow-xs bg-gold text-on-gold group shrink-0 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              title={t("clearDateTitle")}
            >
              <Calendar size={14} className="shrink-0" aria-hidden="true" />
              <span>
                {t("datePillLabel", { date: formattedDateLabel || "" })}
              </span>
              <X
                size={14}
                className="shrink-0 group-hover:scale-125 transition-transform ml-0.5"
                aria-hidden="true"
              />
            </button>
          )}

          <div
            className="flex items-center gap-1.5 sm:gap-2 min-w-0"
            role="tablist"
            aria-label={t("ariaLabel")}
          >
            {DASHBOARD_TASK_FILTERS.map((f, index) => {
              const isSelected = !selectedDate && activeFilter === f.id;
              const showOverdueBadge = f.id === "overdue" && overdueCount > 0;
              return (
                <button
                  key={f.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  tabIndex={
                    isSelected || (selectedDate && index === 0) ? 0 : -1
                  }
                  aria-selected={isSelected}
                  id={`tab-${f.id}`}
                  aria-label={
                    showOverdueBadge
                      ? `${t(`tabs.${f.id}`)} — ${t("overdueBadgeAria", { count: overdueCount })}`
                      : undefined
                  }
                  onClick={() => handleSelectStandardFilter(f.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={cn(
                    "inline-flex items-center rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0 px-3 py-1.5 text-xs",
                    isSelected
                      ? "bg-gold text-on-gold font-bold border border-transparent shadow-xs"
                      : cn(
                          "bg-surface dark:bg-primary-dark/20 text-neutral-200 dark:text-neutral-100 hover:bg-surface-hover dark:hover:bg-primary-dark/40 border border-neutral-700 dark:border-primary/30 shadow-none",
                          selectedDate && "opacity-65 hover:opacity-100",
                        ),
                  )}
                >
                  <span>{t(`tabs.${f.id}`)}</span>
                  {showOverdueBadge && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none tabular-nums",
                        isSelected
                          ? "bg-on-gold/20 text-on-gold"
                          : "bg-danger-500/15 text-danger-500 dark:bg-danger-500/25 dark:text-danger-300",
                      )}
                    >
                      {overdueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto flex-wrap">
          {/* Busca rápida inline (largura estável sem layout shift ao focar) */}
          {onSearchQueryChange && (
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-2.5 text-neutral-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAriaLabel")}
                className="w-40 sm:w-48 transition-colors duration-200 pl-7 pr-6 py-1.5 rounded-lg bg-surface dark:bg-primary-dark/20 border border-neutral-700 dark:border-primary/30 focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/50 text-xs text-neutral-100 placeholder:text-neutral-400 outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange("")}
                  aria-label={t("clearSearchAria")}
                  className="absolute right-1.5 p-0.5 text-neutral-400 hover:text-neutral-100 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {hasMultipleWorkspaces && (
            <Select
              variant="filter"
              compact={true}
              usePortal={true}
              align="right"
              icon={<Layers size={13} aria-hidden="true" />}
              placeholder={t("allWorkspaces")}
              aria-label={t("workspaceFilterAria")}
              options={workspaceSelectOptions}
              value={
                advancedFilters.workspaceId === "all"
                  ? ""
                  : advancedFilters.workspaceId
              }
              onChange={(val) => handleWorkspaceChange(val || "all")}
              className="max-w-[175px]"
              dropdownClassName="w-56"
              triggerClassName={cn(
                "font-medium transition-colors px-2.5 py-1.5 text-xs",
                advancedFilters.workspaceId !== "all"
                  ? "bg-amber-500/15! border-amber-500/50! text-amber-800! dark:bg-gold/15! dark:border-gold/60! dark:text-gold! font-bold!"
                  : "bg-surface! dark:bg-primary-dark/20! hover:bg-surface-hover! dark:hover:bg-primary-dark/40! border-neutral-700! dark:border-primary/30! text-neutral-300! hover:text-neutral-100!",
              )}
            />
          )}

          <button
            type="button"
            onClick={handleToggleQuickHideCompleted}
            aria-pressed={advancedFilters.hideCompleted}
            aria-label={t("quickHideCompletedAria")}
            title={t("quickHideCompleted")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold px-2.5 py-1.5 text-xs",
              advancedFilters.hideCompleted
                ? "bg-emerald-500/15 border-emerald-600/45 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-400/50 dark:text-emerald-300 font-semibold"
                : "bg-surface dark:bg-primary-dark/20 hover:bg-surface-hover dark:hover:bg-primary-dark/40 border-neutral-700 dark:border-primary/30 text-neutral-300 hover:text-neutral-100",
            )}
          >
            <EyeOff size={14} className="shrink-0" aria-hidden="true" />
            <span className="hidden @3xl:inline">
              {t("quickHideCompleted")}
            </span>
          </button>

          <div ref={containerRef} className="relative shrink-0">
            <button
              ref={triggerRef}
              type="button"
              onClick={togglePopover}
              title={t("advancedButtonTitle")}
              aria-expanded={showPopover}
              aria-controls={advancedPopoverId}
              aria-label={t("openAdvancedAria")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer p-1.5 sm:p-2 text-xs",
                activeFiltersCount > 0
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:bg-gold/15 dark:border-gold/60 dark:text-gold shadow-glow-gold-xs font-semibold"
                  : "bg-surface dark:bg-primary-dark/20 hover:bg-surface-hover dark:hover:bg-primary-dark/40 border-neutral-700 dark:border-primary/30 text-neutral-300 hover:text-primary dark:hover:text-gold shadow-none",
              )}
            >
              <SlidersHorizontal
                size={16}
                className={
                  activeFiltersCount > 0 ? "text-amber-700 dark:text-gold" : ""
                }
                aria-hidden="true"
              />
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-tiny font-bold bg-gold text-on-gold tabular-nums">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showPopover && shouldRenderPortal && coords && portalContainer && (
              <TaskAdvancedFilterPopover
                id={advancedPopoverId}
                popoverRef={popoverRef}
                portalContainer={portalContainer}
                floatingStyle={floatingStyle}
                placement={coords.placement}
                activeFiltersCount={activeFiltersCount}
                advancedFilters={advancedFilters}
                columnOptions={columnOptions}
                hasColumns={columns.length > 0}
                taskTypeOptions={taskTypeOptions}
                difficultyOptions={difficultyOptions}
                priorityOptions={priorityOptions}
                availableTags={availableTags}
                tagCounts={tagCounts}
                sortOptions={sortOptions}
                isGamified={isGamified}
                onAdvancedFiltersChange={onAdvancedFiltersChange}
                onReset={handleResetAdvanced}
              />
            )}
          </div>

          {onCreateTask && (
            <>
              <span
                className="hidden sm:block h-5 w-px bg-neutral-700/70 dark:bg-white/10"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={onCreateTask}
                aria-label={
                  !canCreateTask && createTaskDisabledReason
                    ? createTaskDisabledReason
                    : t("newTaskAria")
                }
                title={
                  !canCreateTask ? createTaskDisabledReason : t("newTaskAria")
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg font-bold border transition-[color,background-color,border-color,box-shadow,transform] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold px-3 py-1.5 text-xs cursor-pointer active:scale-95",
                  canCreateTask
                    ? "bg-gold hover:bg-gold-hover text-on-gold border-gold shadow-xs hover:shadow-glow-gold-xs"
                    : "bg-amber-500/10 border-amber-500/40 text-amber-800 hover:bg-amber-500/20 dark:bg-gold/10 dark:border-gold/40 dark:text-gold dark:hover:bg-gold/20",
                )}
              >
                {canCreateTask ? (
                  <Plus
                    size={15}
                    strokeWidth={2.5}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Crown
                    size={14}
                    className="fill-gold/20 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>{t("newTaskButton")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chips de filtros ativos (visibilidade imediata + remoção em 1 clique) */}
      {activeChips.length > 0 && (
        <section
          aria-label={t("activeFiltersAria")}
          className="flex items-center gap-1.5 flex-wrap pt-0.5"
        >
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              aria-label={t("removeFilterAria", {
                label: chip.label,
                value: chip.value,
              })}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold bg-amber-500/12 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/35 text-amber-800 dark:text-gold hover:bg-amber-500/20 dark:hover:bg-gold/25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span className="opacity-75">{chip.label}:</span>
              <span className="max-w-[160px] truncate">{chip.value}</span>
              <X size={11} className="shrink-0 ml-0.5" aria-hidden="true" />
            </button>
          ))}

          {(activeChips.length > 1 || searchQuery.trim() !== "") &&
            onClearAllFilters && (
              <button
                type="button"
                onClick={onClearAllFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold text-neutral-400 hover:text-danger-500 dark:hover:text-danger-400 hover:bg-danger-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <FilterX size={11} aria-hidden="true" />
                <span>{t("clearAllFilters")}</span>
              </button>
            )}
        </section>
      )}
    </div>
  );
}
