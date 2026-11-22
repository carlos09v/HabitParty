"use client";

import {
  Calendar,
  CheckCircle2,
  Layers,
  Lock,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
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
  columns = [],
  workspaces = [],
  advancedFilters = DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  onAdvancedFiltersChange,
  onCreateTask,
  canCreateTask = true,
  createTaskDisabledReason,
  overdueCount = 0,
}: TaskFiltersProps) {
  const t = useTranslations("dashboard.taskFilters");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { isGamified } = useExperienceMode();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const hasMultipleWorkspaces = workspaces.length > 1;
  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen: showPopover,
    toggle: togglePopover,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedHeight: hasMultipleWorkspaces ? 330 : 270,
    estimatedWidth: 440,
    maxAllowedHeight: 420,
    offset: 8,
    margin: 12,
    zIndex: 130,
  });

  const activeFiltersCount = useMemo(() => {
    return (
      (advancedFilters.workspaceId !== "all" ? 1 : 0) +
      (advancedFilters.taskType !== "all" ? 1 : 0) +
      (advancedFilters.columnId !== "all" ? 1 : 0) +
      (advancedFilters.difficulty !== "all" ? 1 : 0) +
      (advancedFilters.hideCompleted ? 1 : 0) +
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

  const workspaceOptions = useMemo(() => {
    const opts = [{ value: "all", label: t("allWorkspaces") }];
    for (const ws of workspaces) {
      if (ws.id) {
        opts.push({
          value: ws.id,
          label: ws.name || t("untitledWorkspace"),
        });
      }
    }
    return opts;
  }, [workspaces, t]);

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

  const sortOptions = useMemo(
    () => [
      { value: "default", label: t("sortDefault") },
      { value: "difficulty", label: t("sortDifficulty") },
      { value: "priority", label: t("sortPriority") },
      { value: "reward", label: t("sortReward") },
    ],
    [t],
  );

  const handleSelectStandardFilter = (id: TaskFilterType) => {
    onFilterChange?.(id);
  };

  const handleResetAdvanced = () => {
    onAdvancedFiltersChange?.(DEFAULT_DASHBOARD_ADVANCED_FILTERS);
  };

  const handleWorkspaceChange = (workspaceId: string) => {
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
  };

  const handleToggleQuickHideCompleted = () => {
    onAdvancedFiltersChange?.({
      ...advancedFilters,
      hideCompleted: !advancedFilters.hideCompleted,
    });
  };

  return (
    <div className="w-full relative">
      <nav
        className="flex items-center justify-between gap-2.5 w-full flex-wrap"
        aria-label={t("ariaLabel")}
      >
        <div
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar px-1 py-1 -mx-1 min-w-0"
          role="tablist"
        >
          {selectedDate && (
            <button
              type="button"
              role="tab"
              id="tab-date"
              aria-selected={true}
              aria-controls="panel-date"
              onClick={onClearDate}
              className="flex items-center gap-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer shadow-xs bg-gold text-on-gold group shrink-0 px-3 py-1.5 text-xs"
              title={t("clearDateTitle")}
            >
              <Calendar size={14} className="shrink-0" />
              <span>
                {t("datePillLabel", { date: formattedDateLabel || "" })}
              </span>
              <X
                size={14}
                className="shrink-0 group-hover:scale-125 transition-transform ml-0.5"
              />
            </button>
          )}

          {DASHBOARD_TASK_FILTERS.map((f) => {
            const isSelected = !selectedDate && activeFilter === f.id;
            const showOverdueBadge = f.id === "overdue" && overdueCount > 0;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${f.id}`}
                id={`tab-${f.id}`}
                aria-label={
                  showOverdueBadge
                    ? `${t(`tabs.${f.id}`)} — ${t("overdueBadgeAria", { count: overdueCount })}`
                    : undefined
                }
                onClick={() => handleSelectStandardFilter(f.id)}
                className={cn(
                  "inline-flex items-center rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background shrink-0 px-3 py-1.5 text-xs",
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto flex-wrap">
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
              "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold px-2.5 py-1.5 text-xs",
              advancedFilters.hideCompleted
                ? "bg-emerald-500/15 border-emerald-600/45 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-400/50 dark:text-emerald-300 font-semibold"
                : "bg-surface dark:bg-primary-dark/20 hover:bg-surface-hover dark:hover:bg-primary-dark/40 border-neutral-700 dark:border-primary/30 text-neutral-300 hover:text-neutral-100",
            )}
          >
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
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
              aria-label={t("openAdvancedAria")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer p-1.5 sm:p-2 text-xs",
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
                <span className="px-1.5 py-0.5 rounded-full text-tiny font-bold bg-gold text-on-gold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showPopover && shouldRenderPortal && coords && (
              <TaskAdvancedFilterPopover
                popoverRef={popoverRef}
                floatingStyle={floatingStyle}
                placement={coords.placement}
                activeFiltersCount={activeFiltersCount}
                advancedFilters={advancedFilters}
                hasMultipleWorkspaces={hasMultipleWorkspaces}
                workspaceOptions={workspaceOptions}
                columnOptions={columnOptions}
                hasColumns={columns.length > 0}
                taskTypeOptions={taskTypeOptions}
                difficultyOptions={difficultyOptions}
                sortOptions={sortOptions}
                isGamified={isGamified}
                onWorkspaceChange={handleWorkspaceChange}
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
                disabled={!canCreateTask}
                aria-label={t("newTaskAria")}
                title={
                  !canCreateTask ? createTaskDisabledReason : t("newTaskAria")
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg font-bold border transition-[color,background-color,border-color,box-shadow,transform] whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gold px-3 py-1.5 text-xs",
                  canCreateTask
                    ? "bg-gold hover:bg-gold-hover text-on-gold border-gold cursor-pointer shadow-xs hover:shadow-glow-gold-xs active:scale-95"
                    : "bg-surface/60 border-neutral-700 text-neutral-400 cursor-not-allowed opacity-70",
                )}
              >
                <Plus
                  size={15}
                  strokeWidth={2.5}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span>{t("newTaskButton")}</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
