"use client";

import {
  ArrowRightLeft,
  Backpack,
  Layers,
  ListTodo,
  Lock,
  Search,
  Timer,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { getFocusIcon, MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
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
  onSelectActivity?: (activity: FocusActivity) => void;
  /** Quando o alvo atual é uma tarefa direta, selecionar uma atividade vincula (Macro + Micro) mantendo o tempo */
  onLinkActivityToTask?: (activity: FocusActivity) => void;
  onSelectBackpackItem?: (item: InventoryItemResponseDTO) => void;
  onSelectTask?: (task: { id: string; title: string }) => void;
  onUnlinkTask?: () => void;
  onOpenUpgradeModal?: () => void;
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
  onSelectActivity,
  onLinkActivityToTask,
  onSelectBackpackItem,
  onSelectTask,
  onUnlinkTask,
  onOpenUpgradeModal,
}: FocusStageTargetSelectorModalProps) {
  const t = useTranslations("focus.targetSelector");
  const [selectorTab, setSelectorTab] = useState<
    "ACTIVITIES" | "TASKS" | "BACKPACK"
  >(initialTab);
  const [taskSearch, setTaskSearch] = useState("");
  const isPremium = useUserStore((s) => s.is_Premium);
  const isTaskSession = currentTarget?.type === "task";
  const canLinkActivityToTask = isTaskSession && Boolean(onLinkActivityToTask);
  const isFilteredMode = onlyActivities || onlyTasks;
  const activeTab = onlyActivities
    ? "ACTIVITIES"
    : onlyTasks
      ? "TASKS"
      : selectorTab;

  const activeActivities = activities;

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return focusableTasks;
    return focusableTasks.filter((task) =>
      task.title.toLowerCase().includes(q),
    );
  }, [focusableTasks, taskSearch]);

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
          <div className="flex items-center rounded-xl bg-surface dark:bg-surface/90 p-1 border border-neutral-700 dark:border-primary/30 w-full">
            <button
              type="button"
              onClick={() => setSelectorTab("ACTIVITIES")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                selectorTab === "ACTIVITIES"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <Layers size={13} />
              <span>
                {t("activitiesTab", { count: activeActivities.length })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectorTab("TASKS")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                selectorTab === "TASKS"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <ListTodo size={13} />
              <span>{t("tasksTab", { count: focusableTasks.length })}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectorTab("BACKPACK")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer",
                selectorTab === "BACKPACK"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              <Backpack size={13} />
              <span>{t("backpackTab", { count: backpackItems.length })}</span>
            </button>
          </div>
        )}

        {/* Lista de Conteúdo */}
        <div className="overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 max-h-[340px]">
          {activeTab === "ACTIVITIES" ? (
            activeActivities.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-700 dark:border-primary/30 rounded-xl">
                {t("emptyActivities")}
              </div>
            ) : (
              <>
                {onlyActivities && canLinkActivityToTask && currentTarget && (
                  <div className="px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary-dark/40 border border-primary/30 dark:border-primary-light/35 text-tiny text-neutral-100 dark:text-neutral-200 leading-relaxed">
                    {t("linkActivityToTaskHint", {
                      taskName: currentTarget.taskName || currentTarget.name,
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
                  {t("macroMicroHint", { activityName: currentTarget.name })}
                </div>
              )}

              {currentTarget?.type === "inventory" && (
                <div className="px-3 py-2 rounded-lg bg-amber-500/10 dark:bg-gold/10 border border-amber-500/30 dark:border-gold/30 text-tiny text-amber-800 dark:text-gold leading-relaxed">
                  {t("backpackCouponTaskHint")}
                </div>
              )}

              {focusableTasks.length > 4 && (
                <div className="relative flex items-center">
                  <Search
                    size={13}
                    className="absolute left-3 text-neutral-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder={t("searchTasksPlaceholder")}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-neutral-700 dark:border-primary/30 bg-surface/70 text-xs text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-gold/50 transition-colors"
                  />
                  {taskSearch && (
                    <button
                      type="button"
                      onClick={() => setTaskSearch("")}
                      className="absolute right-2.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
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
                          <div className="flex items-center gap-2 text-tiny text-neutral-400">
                            <span>
                              {task.type === "daily"
                                ? t("taskTypeDaily")
                                : t("taskTypeTodo")}
                            </span>
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
                            onSelectTask?.({ id: task.id, title: task.title });
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
              {t("emptyBackpack")}
            </div>
          ) : (
            backpackItems.map((item) => {
              const isCurrent = currentTargetId === item.inventoryItemId;
              const remainingMinutes = getItemRemainingMinutes(
                item.remainingSeconds,
              );
              const ItemIcon = item.rewardIcon
                ? getRewardIcon(item.rewardIcon, item.rewardType)
                : Backpack;

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
        </div>
      </div>
    </BaseModal>
  );
}
