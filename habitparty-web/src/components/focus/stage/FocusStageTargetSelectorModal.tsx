"use client";

import {
  ArrowRightLeft,
  Backpack,
  Layers,
  ListTodo,
  Loader2,
  Lock,
  Package,
  Plus,
  Search,
  Timer,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { getFocusIcon, MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActiveTarget,
  FocusActivity,
  FocusableTaskItem,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import {
  formatDurationMinutes,
  getItemRemainingMinutes,
} from "@/utils/focusFormatters";
import { getRewardIcon } from "@/utils/rewardMapper";

export interface FocusStageTargetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  currentTargetId?: string;
  currentTarget?: FocusActiveTarget | null;
  initialTab?: "ACTIVITIES" | "TASKS" | "BACKPACK";
  /** Quando verdadeiro, oculta as abas de Tarefas/Mochila e exibe apenas Atividades para vincular à tarefa atual */
  onlyActivities?: boolean;
  /** Quando verdadeiro, oculta as abas de Atividades/Mochila e exibe apenas Tarefas para vincular à atividade atual */
  onlyTasks?: boolean;
  /** Exibe estado de carregamento enquanto as atividades são buscadas sob demanda */
  isLoadingActivities?: boolean;
  onSelectActivity?: (activity: FocusActivity) => void;
  /** Quando o alvo atual é uma tarefa direta, selecionar uma atividade vincula (Macro + Micro) mantendo o tempo */
  onLinkActivityToTask?: (activity: FocusActivity) => void;
  onSelectBackpackItem?: (item: InventoryItemResponseDTO) => void;
  onSelectTask?: (task: { id: string; title: string }) => void;
  onUnlinkTask?: () => void;
  onOpenUpgradeModal?: () => void;
  onCreateActivity?: () => void;
}

export function FocusStageTargetSelectorModal({
  isOpen,
  onClose,
  activities,
  backpackItems,
  focusableTasks = [],
  currentTargetId,
  currentTarget,
  initialTab = "ACTIVITIES",
  onlyActivities = false,
  onlyTasks = false,
  isLoadingActivities = false,
  onSelectActivity,
  onLinkActivityToTask,
  onSelectBackpackItem,
  onSelectTask,
  onUnlinkTask,
  onOpenUpgradeModal,
  onCreateActivity,
}: FocusStageTargetSelectorModalProps) {
  const t = useTranslations("focus.targetSelector");
  const { isGamified } = useExperienceMode();
  const [selectorTab, setSelectorTab] = useState<
    "ACTIVITIES" | "TASKS" | "BACKPACK"
  >(initialTab);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<
    "ALL" | "daily" | "todo"
  >("ALL");
  const isPremium = useUserStore((s) => s.is_Premium);
  const isTaskSession = currentTarget?.type === "task";
  const canLinkActivityToTask = isTaskSession && Boolean(onLinkActivityToTask);
  const isFilteredMode = onlyActivities || onlyTasks;
  const activeTab = onlyActivities
    ? "ACTIVITIES"
    : onlyTasks
      ? "TASKS"
      : selectorTab;

  const tabRefs = useRef<
    Partial<
      Record<"ACTIVITIES" | "TASKS" | "BACKPACK", HTMLButtonElement | null>
    >
  >({});

  useEffect(() => {
    if (!isOpen) return;
    setSelectorTab(initialTab);
    setTaskSearch("");
    setTaskTypeFilter("ALL");
  }, [isOpen, initialTab]);

  const handleTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabOrder = ["ACTIVITIES", "TASKS", "BACKPACK"] as const;
    const currentIndex = tabOrder.indexOf(selectorTab);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabOrder.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabOrder.length - 1;
    }

    if (nextIndex === -1) return;
    e.preventDefault();
    const nextTab = tabOrder[nextIndex];
    setSelectorTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const activeActivities = activities;

  const filteredTasks = useMemo(() => {
    const normalize = (val: string) =>
      val
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
    const q = normalize(taskSearch.trim());

    return focusableTasks.filter((task) => {
      if (taskTypeFilter !== "ALL" && task.type !== taskTypeFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = normalize(
        [task.title, task.columnTitle, task.workspaceName]
          .filter(Boolean)
          .join(" "),
      );
      return haystack.includes(q);
    });
  }, [focusableTasks, taskSearch, taskTypeFilter]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        onlyActivities
          ? t("linkActivityModalTitle")
          : onlyTasks
            ? t("linkTaskModalTitle")
            : t("title")
      }
      description={
        onlyActivities
          ? t("linkActivityModalDescription")
          : onlyTasks
            ? t("linkTaskModalDescription", {
                activityName: currentTarget?.name || "",
              })
            : t("description")
      }
      headerExtra={
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:bg-gold/15 dark:border-gold/40 flex items-center justify-center dark:text-gold">
          {onlyActivities ? (
            <Layers size={16} />
          ) : onlyTasks ? (
            <ListTodo size={16} />
          ) : (
            <ArrowRightLeft size={16} />
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3 mt-1">
        {/* Abas: Atividades vs Tarefas vs Mochila (ocultadas quando o modal é exclusivo) */}
        {!isFilteredMode && (
          <div
            role="tablist"
            aria-label={t("title")}
            onKeyDown={handleTabListKeyDown}
            className="grid grid-cols-3 gap-1 rounded-xl bg-surface dark:bg-surface/90 p-1 border border-neutral-700 dark:border-primary/30 w-full"
          >
            <button
              ref={(el) => {
                tabRefs.current.ACTIVITIES = el;
              }}
              id="target-selector-tab-ACTIVITIES"
              type="button"
              role="tab"
              aria-selected={selectorTab === "ACTIVITIES"}
              aria-controls="target-selector-panel-ACTIVITIES"
              tabIndex={selectorTab === "ACTIVITIES" ? 0 : -1}
              onClick={() => setSelectorTab("ACTIVITIES")}
              className={cn(
                "min-w-0 px-1.5 sm:px-2 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer",
                selectorTab === "ACTIVITIES"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <Layers size={13} className="shrink-0" />
              <span className="truncate">
                {t("activitiesTab", { count: activeActivities.length })}
              </span>
            </button>
            <button
              ref={(el) => {
                tabRefs.current.TASKS = el;
              }}
              id="target-selector-tab-TASKS"
              type="button"
              role="tab"
              aria-selected={selectorTab === "TASKS"}
              aria-controls="target-selector-panel-TASKS"
              tabIndex={selectorTab === "TASKS" ? 0 : -1}
              onClick={() => setSelectorTab("TASKS")}
              className={cn(
                "min-w-0 px-1.5 sm:px-2 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer",
                selectorTab === "TASKS"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <ListTodo size={13} className="shrink-0" />
              <span className="truncate">
                {t("tasksTab", { count: focusableTasks.length })}
              </span>
            </button>
            <button
              ref={(el) => {
                tabRefs.current.BACKPACK = el;
              }}
              id="target-selector-tab-BACKPACK"
              type="button"
              role="tab"
              aria-selected={selectorTab === "BACKPACK"}
              aria-controls="target-selector-panel-BACKPACK"
              tabIndex={selectorTab === "BACKPACK" ? 0 : -1}
              onClick={() => setSelectorTab("BACKPACK")}
              className={cn(
                "min-w-0 px-1.5 sm:px-2 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer",
                selectorTab === "BACKPACK"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {isGamified ? (
                <Backpack size={13} className="shrink-0" />
              ) : (
                <Package size={13} className="shrink-0" />
              )}
              <span className="truncate">
                {isGamified
                  ? t("backpackTab", { count: backpackItems.length })
                  : t("inventoryTab", { count: backpackItems.length })}
              </span>
            </button>
          </div>
        )}

        {/* Lista de Conteúdo */}
        {(() => {
          const listClassName =
            "overflow-y-auto overscroll-contain custom-scrollbar flex flex-col gap-2 pr-1 max-h-[55dvh] sm:max-h-[340px]";
          const listBody = (
            <>
              {activeTab === "ACTIVITIES" ? (
                isLoadingActivities && activeActivities.length === 0 ? (
                  <output
                    aria-live="polite"
                    className="flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-700 dark:border-primary/30 rounded-xl"
                  >
                    <Loader2
                      size={18}
                      className="animate-spin text-primary-light dark:text-gold"
                    />
                    <span>{t("loadingActivities")}</span>
                  </output>
                ) : activeActivities.length === 0 ? (
                  <div className="p-6 flex flex-col items-center justify-center gap-3 text-center text-xs text-neutral-400 border border-dashed border-neutral-700 dark:border-primary/30 rounded-xl">
                    <p>{t("emptyActivities")}</p>
                    {onCreateActivity && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onCreateActivity();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gold hover:bg-gold-hover text-on-gold text-xs font-bold shadow-glow-gold-xs transition-colors cursor-pointer"
                      >
                        <Plus size={14} aria-hidden="true" />
                        <span>{t("createActivityButton")}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {onlyActivities &&
                      canLinkActivityToTask &&
                      currentTarget && (
                        <div className="px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary-dark/40 border border-primary/30 dark:border-primary-light/35 text-tiny text-neutral-100 dark:text-neutral-200 leading-relaxed">
                          {t("linkActivityToTaskHint", {
                            taskName:
                              currentTarget.taskName || currentTarget.name,
                          })}
                        </div>
                      )}
                    {activeActivities.map((act, index) => {
                      const IconComp = getFocusIcon(act.icon);
                      const isCurrent = currentTargetId === act.id;
                      const isLocked =
                        !isPremium && index >= MAX_FOCUS_ACTIVITIES_FREE;

                      return (
                        <div
                          key={act.id}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
                            isLocked
                              ? "bg-surface/60 dark:bg-neutral-900/40 border-amber-500/35 dark:border-gold/30 opacity-80"
                              : isCurrent
                                ? "bg-amber-500/10 border-amber-500/50 text-amber-800 dark:bg-gold/15 dark:border-gold/60 dark:text-gold"
                                : "bg-card dark:bg-surface/60 border-neutral-700 dark:border-primary/20 hover:border-amber-500/40 dark:hover:border-gold/40 hover:bg-surface",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                                isLocked
                                  ? "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30"
                                  : "bg-primary/10 border-primary/25 text-primary dark:bg-primary-dark/40 dark:border-primary/30 dark:text-primary-light",
                              )}
                            >
                              {isLocked ? (
                                <Lock size={15} />
                              ) : (
                                <IconComp size={16} />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className={cn(
                                  "text-xs font-bold truncate",
                                  isLocked
                                    ? "text-neutral-300"
                                    : "text-neutral-100",
                                )}
                              >
                                {act.name}
                              </span>
                              <span className="text-tiny text-neutral-400">
                                {isLocked
                                  ? t("pausedStatus")
                                  : act.recordType === "POMO"
                                    ? t("pomodoroDuration", {
                                        minutes: act.targetTimeMinutes || 35,
                                      })
                                    : t("freeStopwatch")}
                              </span>
                            </div>
                          </div>

                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenUpgradeModal?.();
                              }}
                              title={t("lockedActivityTitle")}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/40 dark:bg-gold/15 dark:hover:bg-gold/25 dark:text-gold dark:border-gold/40 flex items-center gap-1 shadow-glow-gold-xs"
                            >
                              <Lock size={12} />
                              <span>{t("pausedBadge")}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => {
                                if (isCurrent) return;
                                if (onlyActivities && canLinkActivityToTask) {
                                  onLinkActivityToTask?.(act);
                                } else {
                                  onSelectActivity?.(act);
                                }
                                onClose();
                              }}
                              className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0",
                                isCurrent
                                  ? "bg-gold text-on-gold shadow-glow-gold-xs cursor-default"
                                  : "bg-surface dark:bg-surface/80 hover:bg-amber-500/15 dark:hover:bg-gold/20 text-neutral-200 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-gold border border-neutral-700 dark:border-primary/30 cursor-pointer",
                              )}
                            >
                              {isCurrent ? t("selected") : t("link")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </>
                )
              ) : activeTab === "TASKS" ? (
                <div className="flex flex-col gap-2">
                  {currentTarget?.type === "activity" && (
                    <div className="px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary-dark/30 border border-primary/25 text-tiny text-neutral-300 leading-relaxed">
                      {t("macroMicroHint", {
                        activityName: currentTarget.name,
                      })}
                    </div>
                  )}

                  {currentTarget?.type === "inventory" && (
                    <div className="px-3 py-2 rounded-lg bg-amber-500/10 dark:bg-gold/10 border border-amber-500/30 dark:border-gold/30 text-tiny text-amber-800 dark:text-gold leading-relaxed">
                      {isGamified
                        ? t("backpackCouponTaskHint")
                        : t("inventoryCouponTaskHint")}
                    </div>
                  )}

                  {focusableTasks.length > 0 && (
                    <search className="flex flex-col gap-2">
                      <div className="relative flex items-center">
                        <Search
                          size={13}
                          className="absolute left-3 text-neutral-400 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          placeholder={t("searchTasksPlaceholder")}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          aria-label={t("searchTasksPlaceholder")}
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-neutral-700 dark:border-primary/30 bg-surface/70 text-xs text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-gold/50 transition-colors"
                        />
                        {taskSearch && (
                          <button
                            type="button"
                            onClick={() => setTaskSearch("")}
                            aria-label={t("clearSearchAria")}
                            className="absolute right-2.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <fieldset className="flex items-center gap-1.5 flex-wrap border-0 p-0 m-0">
                        {(
                          [
                            { id: "ALL", label: t("taskFilterAll") },
                            { id: "daily", label: t("taskFilterDaily") },
                            { id: "todo", label: t("taskFilterTodo") },
                          ] as const
                        ).map((filterOpt) => {
                          const active = taskTypeFilter === filterOpt.id;
                          return (
                            <button
                              key={filterOpt.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setTaskTypeFilter(filterOpt.id)}
                              className={cn(
                                "px-2.5 py-0.5 rounded-md border text-tiny font-semibold transition-colors cursor-pointer",
                                active
                                  ? "bg-amber-500/15 border-amber-500/45 text-amber-800 dark:bg-gold/15 dark:border-gold/45 dark:text-gold"
                                  : "bg-surface/60 border-neutral-700 text-neutral-400 hover:text-neutral-100 dark:bg-white/5 dark:border-white/10",
                              )}
                            >
                              {filterOpt.label}
                            </button>
                          );
                        })}
                      </fieldset>
                    </search>
                  )}

                  {filteredTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-700 dark:border-primary/30 rounded-xl">
                      {t("emptyTasks")}
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const isLinked = currentTarget?.taskId === task.id;
                      const canUnlink =
                        isLinked && currentTarget?.type === "activity";

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border transition-colors gap-2",
                            isLinked
                              ? "bg-amber-500/10 border-amber-500/50 text-amber-800 dark:bg-gold/15 dark:border-gold/60 dark:text-gold"
                              : "bg-card dark:bg-surface/60 border-neutral-700 dark:border-primary/20 hover:border-amber-500/40 dark:hover:border-gold/40 hover:bg-surface",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 text-primary dark:bg-primary-dark/40 dark:border-primary/30 flex items-center justify-center dark:text-primary-light shrink-0">
                              <ListTodo size={15} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-bold text-neutral-100 truncate">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-2 text-tiny text-neutral-400 flex-wrap">
                                <span>
                                  {task.type === "daily"
                                    ? t("taskTypeDaily")
                                    : t("taskTypeTodo")}
                                </span>
                                {task.columnTitle && (
                                  <span className="px-1.5 py-px rounded bg-surface border border-neutral-700/80 dark:bg-white/5 dark:border-white/10 text-neutral-300 truncate max-w-[140px]">
                                    {task.columnTitle}
                                  </span>
                                )}
                                {(task.totalFocusMinutes ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-gold font-medium">
                                    <Timer size={10} />
                                    {formatDurationMinutes(
                                      task.totalFocusMinutes ?? 0,
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {canUnlink ? (
                            <button
                              type="button"
                              onClick={() => {
                                onUnlinkTask?.();
                                onClose();
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/35 cursor-pointer"
                            >
                              {t("unlink")}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isLinked}
                              onClick={() => {
                                if (isLinked) return;
                                onSelectTask?.({
                                  id: task.id,
                                  title: task.title,
                                });
                                onClose();
                              }}
                              className={cn(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0",
                                isLinked
                                  ? "bg-gold text-on-gold shadow-glow-gold-xs cursor-default"
                                  : "bg-surface dark:bg-surface/80 hover:bg-amber-500/15 dark:hover:bg-gold/20 text-neutral-200 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-gold border border-neutral-700 dark:border-primary/30 cursor-pointer",
                              )}
                            >
                              {isLinked
                                ? t("selected")
                                : isTaskSession ||
                                    currentTarget?.type === "inventory"
                                  ? t("switchAction")
                                  : t("link")}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : backpackItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-700 dark:border-primary/30 rounded-xl">
                  {isGamified ? t("emptyBackpack") : t("emptyInventory")}
                </div>
              ) : (
                backpackItems.map((item) => {
                  const isCurrent = currentTargetId === item.inventoryItemId;
                  const remainingMinutes = getItemRemainingMinutes(
                    item.remainingSeconds,
                  );
                  const ItemIcon = item.rewardIcon
                    ? getRewardIcon(item.rewardIcon, item.rewardType)
                    : isGamified
                      ? Backpack
                      : Package;

                  return (
                    <div
                      key={item.inventoryItemId}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
                        isCurrent
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-800 dark:bg-gold/15 dark:border-gold/60 dark:text-gold"
                          : "bg-card dark:bg-surface/60 border-neutral-700 dark:border-primary/20 hover:border-amber-500/40 dark:hover:border-gold/40 hover:bg-surface",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 text-primary dark:bg-primary-dark/40 dark:border-primary/30 flex items-center justify-center dark:text-primary-light shrink-0">
                          <ItemIcon size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-neutral-100 truncate">
                            {item.rewardName || t("defaultItemName")}
                          </span>
                          <span className="text-tiny text-neutral-400">
                            {remainingMinutes > 0
                              ? t("remainingMinutesBalance", {
                                  minutes: remainingMinutes,
                                })
                              : t("completedCoupon")}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          if (isCurrent) return;
                          onSelectBackpackItem?.(item);
                          onClose();
                        }}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-colors shrink-0",
                          isCurrent
                            ? "bg-gold text-on-gold shadow-glow-gold-xs cursor-default"
                            : "bg-surface dark:bg-surface/80 hover:bg-amber-500/15 dark:hover:bg-gold/20 text-neutral-200 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-gold border border-neutral-700 dark:border-primary/30 cursor-pointer",
                        )}
                      >
                        {isCurrent ? t("selected") : t("link")}
                      </button>
                    </div>
                  );
                })
              )}
            </>
          );

          return isFilteredMode ? (
            <div className={listClassName}>{listBody}</div>
          ) : (
            <div
              id={`target-selector-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`target-selector-tab-${activeTab}`}
              className={listClassName}
            >
              {listBody}
            </div>
          );
        })()}
      </div>
    </BaseModal>
  );
}
