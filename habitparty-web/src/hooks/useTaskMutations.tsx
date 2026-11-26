"use client";

import { useLocale, useTranslations } from "next-intl";
import { startTransition, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  changeTaskStatus,
  completeTask,
  createTask,
  deleteTask,
  recordHabitScore,
} from "@/actions/taskActions";
import {
  HABIT_SCORE_COOLDOWN_MS,
  MAX_DAILY_REWARDED_HABIT_SCORES,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInFlightSet } from "@/hooks/useInFlightSet";
import type { AppLocale } from "@/i18n/config";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { ChecklistItem, Task } from "@/types/task";
import { getTodayDateString } from "@/utils/date";
import {
  calculateTaskPenalty,
  formatCoins,
  getTaskRewardBreakdown,
} from "@/utils/economy";
import { awardUserRewards, deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";
import {
  buildCreateTaskPayloadFromTask,
  computeOptimisticHabitDelta,
  mapTaskResponseToTask,
  mergeTaskWithResponseDTO,
} from "@/utils/taskMapper";

function notifyTasksChanged(detail?: { completedToday?: boolean }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("habitparty:tasks-changed", { detail }),
    );
  }
}

export interface TaskToggleRollbackState {
  completed: boolean;
  hasClaimedReward?: boolean;
  lastCompletedAt?: string;
  checklist?: ChecklistItem[];
}

export interface HabitRollbackState {
  positiveCount: number;
  negativeCount: number;
  streak?: number;
  highestStreak?: number;
  completed: boolean;
  lastCompletedAt?: string;
}

export function applyOptimisticHabitRollback(
  task: Task,
  previousState: HabitRollbackState,
): Task {
  return {
    ...task,
    positiveCount: previousState.positiveCount,
    negativeCount: previousState.negativeCount,
    streak: previousState.streak,
    highestStreak: previousState.highestStreak,
    completed: previousState.completed,
    lastCompletedAt: previousState.lastCompletedAt,
  };
}

export function applyOptimisticTaskToggle(
  task: Task,
  completed: boolean,
  nowIso = new Date().toISOString(),
): Task {
  return {
    ...task,
    completed,
    hasClaimedReward: completed ? true : task.hasClaimedReward,
    lastCompletedAt: completed ? nowIso : task.lastCompletedAt,
    checklist:
      completed &&
      task.type?.toLowerCase() !== "habit" &&
      task.checklist &&
      task.checklist.length > 0
        ? task.checklist.map((item) => ({ ...item, isCompleted: true }))
        : task.checklist,
  };
}

export function applyOptimisticTaskRollback(
  task: Task,
  previousState: TaskToggleRollbackState,
): Task {
  return {
    ...task,
    completed: previousState.completed,
    hasClaimedReward: previousState.hasClaimedReward,
    lastCompletedAt: previousState.lastCompletedAt,
    checklist:
      previousState.checklist !== undefined
        ? previousState.checklist
        : task.checklist,
  };
}

export function applyOptimisticHabitChange(
  task: Task,
  delta: number,
  timeZone?: string | null,
): Task {
  return {
    ...task,
    ...computeOptimisticHabitDelta(task, delta, timeZone),
  };
}

function resolveRewardStreakBeforeAction(
  task: Task,
  serverStreakAfterAction?: number,
): number {
  const taskType = task.type?.toLowerCase();
  if (taskType === "daily" && typeof serverStreakAfterAction === "number") {
    return Math.max(0, serverStreakAfterAction - 1);
  }
  if (
    taskType === "habit" &&
    serverStreakAfterAction === 1 &&
    (task.streak ?? 0) >= 1
  ) {
    return 0;
  }
  return task.currentStreak ?? task.streak ?? task.positiveCount ?? 0;
}

export interface UseTaskMutationsOptions {
  findTask: (taskId: string) => Task | undefined;
  onOptimisticToggle: (taskId: string, completed: boolean) => void;
  onOptimisticHabit: (taskId: string, delta: number) => void;
  onRollbackToggle: (
    taskId: string,
    previousState: TaskToggleRollbackState,
  ) => void;
  onRollbackHabit?: (taskId: string, previousState: HabitRollbackState) => void;
  onOptimisticDelete?: (task: Task, columnId?: string) => void;
  onRollbackDelete?: (task: Task, columnId?: string) => void;
  onTaskDuplicated?: (
    duplicatedTask: Task,
    targetColumnId: string,
    sourceTaskId?: string,
  ) => void;
  onTaskUpdatedInDetails?: (task: Task) => void;
  onReconcileTask?: (task: Task) => void;
  defaultColumnId?: string;
}

/**
 * Hook centralizado para mutações de tarefas (status, hábitos, exclusão com rollback e duplicação).
 * Elimina duplicação entre Kanban (useBoardTaskActions) e Dashboard (useDashboardTaskActions).
 * Orquestra: atualizações otimistas, sons, Server Actions, sonner toasts e sincronização do Zustand userStore.
 */
export function useTaskMutations({
  findTask,
  onOptimisticToggle,
  onOptimisticHabit,
  onRollbackToggle,
  onRollbackHabit,
  onOptimisticDelete,
  onRollbackDelete,
  onTaskDuplicated,
  onTaskUpdatedInDetails,
  onReconcileTask,
  defaultColumnId,
}: UseTaskMutationsOptions) {
  const t = useTranslations("dashboard.taskShared.mutations");
  const tLevelUp = useTranslations("dashboard.taskShared.levelUp");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const {
    activeIds: duplicatingTaskIds,
    has: isTaskDuplicating,
    setPending: setTaskDuplicating,
  } = useInFlightSet();
  // Mapeia taskId -> todayIso (YYYY-MM-DD) para expirar automaticamente na virada da meia-noite em Diárias
  const rewardedTaskDateRef = useRef<Map<string, string>>(new Map());
  const inFlightToggleTasksRef = useRef<Set<string>>(new Set());
  const inFlightHabitTasksRef = useRef<Set<string>>(new Set());
  const inFlightDeleteTasksRef = useRef<Set<string>>(new Set());
  const pendingUndoDeletesRef = useRef<
    Map<
      string,
      {
        task: Task;
        colId?: string;
        timer: ReturnType<typeof setTimeout>;
      }
    >
  >(new Map());
  const habitLastActionAtRef = useRef<Map<string, number>>(new Map());

  // Garante que exclusões pendentes na janela de "Desfazer" sejam efetivadas ao desmontar/navegar
  useEffect(() => {
    const pendingMap = pendingUndoDeletesRef.current;
    return () => {
      if (pendingMap.size === 0) return;
      for (const entry of pendingMap.values()) {
        clearTimeout(entry.timer);
        void deleteTask(entry.task.id, false).then((res) => {
          if (res.success) {
            useFocusTimerStore
              .getState()
              .handleExternalTaskRemovedOrCompleted(entry.task.id);
            notifyTasksChanged();
          } else {
            useOptimisticDashboardStore
              .getState()
              .unmarkTaskDeleted(entry.task.id);
          }
        });
      }
      pendingMap.clear();
    };
  }, []);

  const xpLabel = isGamified ? t("xpLabel") : t("xpLabelProductivity");
  const goldLabel = isGamified ? t("goldLabel") : t("goldLabelProductivity");

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean): boolean => {
      if (taskId.startsWith("temp-")) return false;
      if (inFlightToggleTasksRef.current.has(taskId)) return false;

      const targetTask = findTask(taskId);
      if (!targetTask) return false;

      inFlightToggleTasksRef.current.add(taskId);

      const userTz = useUserStore.getState().user?.timezone;
      const todayIso = getTodayDateString(new Date(), userTz);
      const isDailyTask = targetTask.type?.toLowerCase() === "daily";
      const rewardedOnDate = rewardedTaskDateRef.current.get(taskId);
      const wasRewardedInSession = isDailyTask
        ? rewardedOnDate === todayIso
        : Boolean(rewardedOnDate);

      if (targetTask.completed || targetTask.hasClaimedReward) {
        rewardedTaskDateRef.current.set(taskId, todayIso);
      }

      const alreadyRewarded = Boolean(
        targetTask.hasClaimedReward || wasRewardedInSession,
      );
      if (completed) {
        rewardedTaskDateRef.current.set(taskId, todayIso);
      }

      const rollbackState: TaskToggleRollbackState = {
        completed: Boolean(targetTask.completed),
        hasClaimedReward: targetTask.hasClaimedReward,
        lastCompletedAt: targetTask.lastCompletedAt,
        checklist: targetTask.checklist?.map((item) => ({ ...item })),
      };
      const optimisticStore = useOptimisticDashboardStore.getState();
      const optimisticTask = applyOptimisticTaskToggle(targetTask, completed);

      optimisticStore.markTaskInFlight(taskId);
      onOptimisticToggle(taskId, completed);
      optimisticStore.upsertTask(optimisticTask);
      if (completed) {
        soundEffects.playTaskCompleteSound();
      }
      onTaskUpdatedInDetails?.(optimisticTask);

      startTransition(async () => {
        try {
          const res = completed
            ? await completeTask(taskId)
            : await changeTaskStatus(taskId, "PENDING");

          if (!res.success) {
            if (completed && !alreadyRewarded) {
              rewardedTaskDateRef.current.delete(taskId);
            }
            toast.error(res.error || t("statusUpdateError"));
            const rolledBackTask = applyOptimisticTaskRollback(
              targetTask,
              rollbackState,
            );
            onRollbackToggle(taskId, rollbackState);
            optimisticStore.upsertTask(rolledBackTask);
            onTaskUpdatedInDetails?.(rolledBackTask);
            return;
          }

          const userTimeZone = useUserStore.getState().user?.timezone;
          const reconciledTask = res.data
            ? mergeTaskWithResponseDTO(targetTask, res.data, userTimeZone)
            : null;
          if (reconciledTask) {
            onReconcileTask?.(reconciledTask);
            optimisticStore.upsertTask(reconciledTask);
            onTaskUpdatedInDetails?.(reconciledTask);
          }
          notifyTasksChanged({ completedToday: completed });

          if (completed) {
            if (targetTask.type?.toLowerCase() !== "habit") {
              useFocusTimerStore
                .getState()
                .handleExternalTaskRemovedOrCompleted(taskId);
            }
            const completionLabel =
              targetTask.type?.toLowerCase() === "habit"
                ? t("habitCompleted")
                : targetTask.type?.toLowerCase() === "daily"
                  ? t("dailyCompleted")
                  : t("todoCompleted");

            // Proteção contra ganho múltiplo de Ouro/XP; prioriza o veredicto explícito do backend (ex: Dia 2 pós-meia-noite)
            const serverAlreadyRewarded =
              res.data?.rewardGranted === false ||
              (res.data?.rewardGranted !== true && alreadyRewarded);
            if (serverAlreadyRewarded) {
              toast.success(
                <span>
                  {completionLabel}{" "}
                  <span className="text-neutral-300 font-normal">
                    ({t("rewardAlreadyClaimed")})
                  </span>
                </span>,
              );
              return;
            }

            rewardedTaskDateRef.current.set(
              taskId,
              getTodayDateString(new Date(), userTimeZone),
            );

            // Se era um To-Do Hardcore atrasado sem penalidade aplicada antes da conclusão,
            // o backend deduz a penalidade antes de conceder a recompensa tardia
            const hasServerPenalty =
              res.data?.penaltyAppliedXp !== undefined ||
              res.data?.penaltyAppliedCoins !== undefined;
            if (
              hasServerPenalty ||
              (targetTask.type?.toLowerCase() === "todo" &&
                Boolean(targetTask.isHardcoreModeEnabled) &&
                !targetTask.isPenaltyApplied &&
                Boolean(res.data?.isPenaltyApplied))
            ) {
              const overduePenalty = hasServerPenalty
                ? {
                    xp: res.data?.penaltyAppliedXp ?? 0,
                    gold: Number(res.data?.penaltyAppliedCoins ?? 0),
                  }
                : calculateTaskPenalty({
                    taskType: targetTask.type,
                    difficulty: targetTask.difficulty,
                    importanceType: targetTask.importanceType,
                    repeatType: targetTask.repeatType,
                    resetCounter: targetTask.resetCounter,
                    currentStreak:
                      targetTask.currentStreak ?? targetTask.streak ?? 0,
                    isHardcoreModeEnabled: targetTask.isHardcoreModeEnabled,
                    dueDate: targetTask.dueDate,
                    checklist: rollbackState.checklist,
                    timeZone: userTimeZone,
                  });
              const penaltyResult = deductUserPenalty(
                overduePenalty.xp,
                overduePenalty.gold,
              );
              optimisticStore.addTransaction({
                xpAmount: -penaltyResult.xpDeducted,
                goldAmount: -penaltyResult.coinsDeducted,
                transactionType: "TASK_FAILED",
              });
            }

            const rewardStreak = resolveRewardStreakBeforeAction(
              targetTask,
              res.data?.currentStreak,
            );

            const breakdown = getTaskRewardBreakdown({
              taskType: targetTask.type,
              difficulty: targetTask.difficulty,
              importanceType: targetTask.importanceType,
              repeatType: targetTask.repeatType,
              resetCounter: targetTask.resetCounter,
              currentStreak: rewardStreak,
              isHardcoreModeEnabled: targetTask.isHardcoreModeEnabled,
              dueDate: targetTask.dueDate,
              isPenaltyApplied:
                targetTask.isPenaltyApplied || res.data?.isPenaltyApplied,
              checklist: res.data?.checklist ?? rollbackState.checklist,
              locale,
              timeZone: useUserStore.getState().user?.timezone,
              isGamified,
            });

            const xp = breakdown.finalReward.xp;
            const gold = breakdown.finalReward.gold;

            const rewardResult = awardUserRewards(xp, gold, {
              locale,
              levelUpTitle: tLevelUp("title"),
              congratsPrefix: tLevelUp("congratsPrefix"),
              congratsSuffix: tLevelUp("congratsSuffix"),
              isTaskCompletion: true,
            });
            optimisticStore.addTransaction({
              referenceId: taskId,
              xpAmount: xp,
              goldAmount: gold,
              transactionType: "TASK_COMPLETED",
            });

            // Se não subiu de nível, exibe o toast padrão contextual ao tipo da atividade
            if (!rewardResult.didLevelUp) {
              if (xp > 0 || gold > 0) {
                toast.success(
                  <span>
                    {completionLabel} (
                    <strong>
                      +{xp} {xpLabel}
                    </strong>{" "}
                    •{" "}
                    <strong>
                      +{formatCoins(gold, { locale })} {goldLabel}
                    </strong>
                    )
                    {breakdown.hasBonus && (
                      <span className="block text-label-g text-emerald-400 mt-0.5 font-normal">
                        {t("bonusRoutine", {
                          stage: breakdown.stageLabel,
                          percent: breakdown.bonusPercentage,
                        })}
                      </span>
                    )}
                    {breakdown.hasDecay && (
                      <span className="block text-label-g text-neutral-400 mt-0.5 font-normal">
                        {targetTask.type?.toLowerCase() === "todo"
                          ? t("decayOverdue", {
                              stage: breakdown.stageLabel,
                              percent: breakdown.decayPercentage,
                            })
                          : t("decayRoutine", {
                              stage: breakdown.stageLabel,
                              percent: breakdown.decayPercentage,
                            })}
                      </span>
                    )}
                  </span>,
                );
              } else {
                toast.success(completionLabel);
              }
            }
          } else {
            if (!reconciledTask?.hasClaimedReward) {
              rewardedTaskDateRef.current.delete(taskId);
            }

            if (res.data?.rewardReverted) {
              const revertedXp = Math.max(0, res.data.revertedXp ?? 0);
              const revertedCoins = Math.max(
                0,
                Number(res.data.revertedCoins ?? 0),
              );
              if (revertedXp > 0 || revertedCoins > 0) {
                deductUserPenalty(revertedXp, revertedCoins);
              }
              const userTimeZone = useUserStore.getState().user?.timezone;
              const todayIso = getTodayDateString(new Date(), userTimeZone);
              useUserStore
                .getState()
                .revertTaskCompletionToday(
                  todayIso,
                  Boolean(res.data.streakReverted),
                );
              optimisticStore.revertTaskTransaction({
                taskId,
                revertedXp,
                revertedCoins,
                streakRevertedDate: res.data.streakReverted
                  ? todayIso
                  : undefined,
              });

              const params = {
                xp: revertedXp,
                xpLabel,
                coins: formatCoins(revertedCoins, { locale }),
                goldLabel,
              };
              if (res.data.isRewardClaimed) {
                toast.info(t("taskUncheckedPartialReward", params));
              } else {
                toast.success(t("taskUncheckedReverted", params));
              }
            } else {
              toast.success(t("taskUnchecked"));
            }
          }
        } finally {
          inFlightToggleTasksRef.current.delete(taskId);
          useOptimisticDashboardStore.getState().unmarkTaskInFlight(taskId);
        }
      });

      return true;
    },
    [
      findTask,
      onOptimisticToggle,
      onRollbackToggle,
      onTaskUpdatedInDetails,
      onReconcileTask,
      t,
      tLevelUp,
      locale,
      xpLabel,
      goldLabel,
      isGamified,
    ],
  );

  const handleHabitChange = useCallback(
    (taskId: string, delta: number): boolean => {
      if (taskId.startsWith("temp-")) return false;
      if (inFlightHabitTasksRef.current.has(taskId)) return false;

      const now = Date.now();
      const lastActionAt = habitLastActionAtRef.current.get(taskId) ?? 0;
      if (now - lastActionAt < HABIT_SCORE_COOLDOWN_MS) return false;

      const targetTask = findTask(taskId);
      if (!targetTask) return false;

      inFlightHabitTasksRef.current.add(taskId);
      habitLastActionAtRef.current.set(taskId, now);

      const habitRollbackState: HabitRollbackState = {
        positiveCount: targetTask.positiveCount ?? 0,
        negativeCount: targetTask.negativeCount ?? 0,
        streak: targetTask.streak,
        highestStreak: targetTask.highestStreak,
        completed: Boolean(targetTask.completed),
        lastCompletedAt: targetTask.lastCompletedAt,
      };

      // Atualização otimista imediata na visualização do usuário
      const userTzForOptimistic = useUserStore.getState().user?.timezone;
      const optimisticHabitTask = applyOptimisticHabitChange(
        targetTask,
        delta,
        userTzForOptimistic,
      );
      const optimisticStore = useOptimisticDashboardStore.getState();
      optimisticStore.markTaskInFlight(taskId);
      optimisticStore.upsertTask(optimisticHabitTask);
      onOptimisticHabit(taskId, delta);
      onTaskUpdatedInDetails?.(optimisticHabitTask);
      if (delta > 0) {
        soundEffects.playHabitSound();
      } else if (delta < 0) {
        soundEffects.playPenaltySound();
      }

      startTransition(async () => {
        try {
          const res = await recordHabitScore(taskId, delta);

          if (!res.success) {
            toast.error(res.error || t("habitScoreError"));
            const rolledBackTask = applyOptimisticHabitRollback(
              targetTask,
              habitRollbackState,
            );
            onRollbackHabit?.(taskId, habitRollbackState);
            useOptimisticDashboardStore.getState().upsertTask(rolledBackTask);
            onTaskUpdatedInDetails?.(rolledBackTask);
            return;
          }

          const optimisticStore = useOptimisticDashboardStore.getState();

          // Reconcilia os contadores e streak exatos retornados pelo backend
          const userTimeZone = useUserStore.getState().user?.timezone;
          const reconciledTask = res.data
            ? mergeTaskWithResponseDTO(targetTask, res.data, userTimeZone)
            : null;
          if (reconciledTask) {
            onReconcileTask?.(reconciledTask);
            optimisticStore.upsertTask(reconciledTask);
            onTaskUpdatedInDetails?.(reconciledTask);
          }
          notifyTasksChanged({ completedToday: delta > 0 });

          if (delta > 0) {
            if (res.data?.rewardGranted === false) {
              toast.info(
                t("habitRewardCapReached", {
                  limit: MAX_DAILY_REWARDED_HABIT_SCORES,
                }),
              );
              return;
            }

            const rewardStreak = resolveRewardStreakBeforeAction(
              targetTask,
              res.data?.currentStreak,
            );

            const breakdown = getTaskRewardBreakdown({
              taskType: targetTask.type,
              importanceType: targetTask.importanceType,
              resetCounter: targetTask.resetCounter,
              currentStreak: rewardStreak,
              locale,
              isGamified,
            });

            const xp = breakdown.finalReward.xp;
            const gold = breakdown.finalReward.gold;

            const rewardResult = awardUserRewards(xp, gold, {
              locale,
              levelUpTitle: tLevelUp("title"),
              congratsPrefix: tLevelUp("congratsPrefix"),
              congratsSuffix: tLevelUp("congratsSuffix"),
              isTaskCompletion: true,
            });
            optimisticStore.addTransaction({
              referenceId: taskId,
              xpAmount: xp,
              goldAmount: gold,
              transactionType: "TASK_COMPLETED",
            });

            // Se não subiu de nível, exibe o toast padrão do hábito
            if (!rewardResult.didLevelUp) {
              if (xp > 0 || gold > 0) {
                toast.success(
                  <span>
                    {t("habitRecorded")} (
                    <strong>
                      +{xp} {xpLabel}
                    </strong>{" "}
                    •{" "}
                    <strong>
                      +{formatCoins(gold, { locale })} {goldLabel}
                    </strong>
                    )
                    {breakdown.hasDecay && (
                      <span className="block text-label-g text-neutral-400 mt-0.5 font-normal">
                        {t("decayHabit", {
                          stage: breakdown.stageLabel,
                          percent: breakdown.decayPercentage,
                        })}
                      </span>
                    )}
                  </span>,
                );
              } else {
                toast.success(t("positiveHabitSuccess"));
              }
            }
          } else if (delta < 0) {
            // Penalidade por hábito negativo
            const penalty = calculateTaskPenalty({
              taskType: targetTask.type,
              importanceType: targetTask.importanceType,
              resetCounter: targetTask.resetCounter,
              currentStreak:
                targetTask.currentStreak ??
                targetTask.streak ??
                targetTask.positiveCount ??
                0,
            });

            const penaltyResult = deductUserPenalty(penalty.xp, penalty.gold);
            optimisticStore.addTransaction({
              xpAmount: -penaltyResult.xpDeducted,
              goldAmount: -penaltyResult.coinsDeducted,
              transactionType: "BAD_HABIT_PENALTY",
            });

            toast.error(
              <span>
                {t("habitPenalty")} (
                <strong>
                  -{penaltyResult.xpDeducted} {xpLabel}
                </strong>{" "}
                •{" "}
                <strong>
                  -{formatCoins(penaltyResult.coinsDeducted, { locale })}{" "}
                  {goldLabel}
                </strong>
                )
              </span>,
            );
          }
        } finally {
          inFlightHabitTasksRef.current.delete(taskId);
          useOptimisticDashboardStore.getState().unmarkTaskInFlight(taskId);
        }
      });

      return true;
    },
    [
      findTask,
      onOptimisticHabit,
      onRollbackHabit,
      onTaskUpdatedInDetails,
      onReconcileTask,
      t,
      tLevelUp,
      locale,
      xpLabel,
      goldLabel,
      isGamified,
    ],
  );

  const handleDeleteTask = useCallback(
    async (task: Task, targetColumnId?: string, deleteHistory = false) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      if (task.id.startsWith("temp-")) {
        onOptimisticDelete?.(task, colId);
        return;
      }
      if (inFlightDeleteTasksRef.current.has(task.id)) return;
      inFlightDeleteTasksRef.current.add(task.id);

      const optimisticStore = useOptimisticDashboardStore.getState();
      optimisticStore.markTaskInFlight(task.id);
      onOptimisticDelete?.(task, colId);
      optimisticStore.markTaskDeleted(task.id);

      try {
        const res = await deleteTask(task.id, deleteHistory);
        if (!res.success) {
          optimisticStore.unmarkTaskDeleted(task.id);
          onRollbackDelete?.(task, colId);
          toast.error(res.error || t("deleteError"));
          return;
        }

        useFocusTimerStore
          .getState()
          .handleExternalTaskRemovedOrCompleted(task.id);

        if (deleteHistory) {
          optimisticStore.clear({ preserveInFlight: true });
        }

        notifyTasksChanged();
        toast.success(t("deleteSuccess", { title: task.title }));
      } finally {
        inFlightDeleteTasksRef.current.delete(task.id);
        useOptimisticDashboardStore.getState().unmarkTaskInFlight(task.id);
      }
    },
    [defaultColumnId, onOptimisticDelete, onRollbackDelete, t],
  );

  const scheduleUndoDeleteTask = useCallback(
    (task: Task, targetColumnId?: string) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      if (task.id.startsWith("temp-")) {
        onOptimisticDelete?.(task, colId);
        return;
      }
      if (
        inFlightDeleteTasksRef.current.has(task.id) ||
        pendingUndoDeletesRef.current.has(task.id)
      ) {
        return;
      }

      const optimisticStore = useOptimisticDashboardStore.getState();
      onOptimisticDelete?.(task, colId);
      optimisticStore.markTaskDeleted(task.id);

      const timer = setTimeout(async () => {
        const entry = pendingUndoDeletesRef.current.get(task.id);
        if (!entry) return;
        pendingUndoDeletesRef.current.delete(task.id);

        if (inFlightDeleteTasksRef.current.has(task.id)) return;
        inFlightDeleteTasksRef.current.add(task.id);
        const currentStore = useOptimisticDashboardStore.getState();
        currentStore.markTaskInFlight(task.id);

        try {
          const res = await deleteTask(task.id, false);
          if (!res.success) {
            currentStore.unmarkTaskDeleted(task.id);
            onRollbackDelete?.(entry.task, entry.colId);
            toast.error(res.error || t("deleteError"));
            return;
          }

          useFocusTimerStore
            .getState()
            .handleExternalTaskRemovedOrCompleted(task.id);
          notifyTasksChanged();
        } finally {
          inFlightDeleteTasksRef.current.delete(task.id);
          useOptimisticDashboardStore.getState().unmarkTaskInFlight(task.id);
        }
      }, 5000);

      pendingUndoDeletesRef.current.set(task.id, { task, colId, timer });

      toast(t("deleteUndoToast", { title: task.title }), {
        duration: 5000,
        action: {
          label: t("undoAction"),
          onClick: () => {
            const entry = pendingUndoDeletesRef.current.get(task.id);
            if (!entry) return;
            clearTimeout(entry.timer);
            pendingUndoDeletesRef.current.delete(task.id);
            useOptimisticDashboardStore.getState().unmarkTaskDeleted(task.id);
            onRollbackDelete?.(entry.task, entry.colId);
            toast.success(
              t("deleteRestoredToast", { title: entry.task.title }),
            );
          },
        },
      });
    },
    [defaultColumnId, onOptimisticDelete, onRollbackDelete, t],
  );

  const handleDuplicateTask = useCallback(
    async (task: Task, targetColumnId?: string) => {
      if (isTaskDuplicating(task.id)) {
        return;
      }

      const colId = targetColumnId || task.columnId || defaultColumnId;
      if (!colId) {
        toast.error(t("duplicateColumnError"));
        return;
      }

      setTaskDuplicating(task.id, true);
      try {
        const userTimeZone = useUserStore.getState().user?.timezone;
        const basePayload = buildCreateTaskPayloadFromTask(task, userTimeZone);
        const payload = task.id.startsWith("temp-")
          ? basePayload
          : { ...basePayload, afterTaskId: task.id };

        const res = await createTask(colId, payload, task.checklist);
        if (!res.success) {
          toast.error(res.error || t("duplicateError"));
          return;
        }

        const clonedChecklist =
          res.data?.checklist && res.data.checklist.length > 0
            ? res.data.checklist
            : task.checklist?.map((item, idx) => ({
                ...item,
                id: `dup-chk-${Date.now()}-${idx}`,
                isCompleted: false,
              }));

        const duplicatedTask: Task = res.data
          ? {
              ...mapTaskResponseToTask(res.data, colId, userTimeZone, {
                id: task.workspaceId,
                name: task.workspaceName,
              }),
              checklist: clonedChecklist,
            }
          : {
              ...task,
              id: `dup-${Date.now()}`,
              status: "PENDING",
              completed: false,
              hasClaimedReward: false,
              isRewardClaimed: false,
              streak: 0,
              currentStreak: 0,
              positiveCount: 0,
              negativeCount: 0,
              totalFocusMinutes: 0,
              focusCyclesCount: 0,
              lastCompletedAt: undefined,
              isPenaltyApplied: false,
              emailReminderSent: false,
              columnId: colId,
              order: task.order,
              checklist: clonedChecklist,
            };

        onTaskDuplicated?.(duplicatedTask, colId, task.id);
        useOptimisticDashboardStore.getState().upsertTask(duplicatedTask);
        notifyTasksChanged();
        soundEffects.playCreateSound();
        toast.success(t("duplicateSuccess", { title: task.title }));
      } finally {
        setTaskDuplicating(task.id, false);
      }
    },
    [
      defaultColumnId,
      isTaskDuplicating,
      onTaskDuplicated,
      setTaskDuplicating,
      t,
    ],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleDuplicateTask,
    duplicatingTaskIds,
  };
}
