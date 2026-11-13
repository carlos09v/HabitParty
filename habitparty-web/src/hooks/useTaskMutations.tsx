"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import {
  changeTaskStatus,
  completeTask,
  createTask,
  deleteTask,
  recordHabitScore,
} from "@/actions/taskActions";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { Task } from "@/types/task";
import {
  calculateTaskPenalty,
  formatCoins,
  getTaskRewardBreakdown,
} from "@/utils/economy";
import { awardUserRewards, deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";
import {
  buildCreateTaskPayloadFromTask,
  mergeTaskWithResponseDTO,
} from "@/utils/taskMapper";

function notifyTasksChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habitparty:tasks-changed"));
  }
}

interface TaskToggleRollbackState {
  completed: boolean;
  hasClaimedReward?: boolean;
  lastCompletedAt?: string;
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
    previousState: {
      completed: boolean;
      hasClaimedReward?: boolean;
      lastCompletedAt?: string;
    },
  ) => void;
  onOptimisticDelete?: (task: Task, columnId?: string) => void;
  onRollbackDelete?: (task: Task, columnId?: string) => void;
  onTaskDuplicated?: (duplicatedTask: Task, targetColumnId: string) => void;
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
  const [isPending, startTransition] = useTransition();
  const rewardedTaskIdsRef = useRef<Set<string>>(new Set());

  const xpLabel = isGamified ? t("xpLabel") : t("xpLabelProductivity");
  const goldLabel = isGamified ? t("goldLabel") : t("goldLabelProductivity");

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      const targetTask = findTask(taskId);
      if (!targetTask) return;

      if (targetTask.completed || targetTask.hasClaimedReward) {
        rewardedTaskIdsRef.current.add(taskId);
      }

      const alreadyRewarded = Boolean(
        targetTask.hasClaimedReward || rewardedTaskIdsRef.current.has(taskId),
      );
      const rollbackState: TaskToggleRollbackState = {
        completed: Boolean(targetTask.completed),
        hasClaimedReward: targetTask.hasClaimedReward,
        lastCompletedAt: targetTask.lastCompletedAt,
      };

      onOptimisticToggle(taskId, completed);
      onTaskUpdatedInDetails?.({
        ...targetTask,
        completed,
        hasClaimedReward: completed ? true : targetTask.hasClaimedReward,
      });

      startTransition(async () => {
        const res = completed
          ? await completeTask(taskId)
          : await changeTaskStatus(taskId, "PENDING");

        if (!res.success) {
          toast.error(res.error || t("statusUpdateError"));
          onRollbackToggle(taskId, rollbackState);
          onTaskUpdatedInDetails?.(targetTask);
          return;
        }

        const reconciledTask = res.data
          ? mergeTaskWithResponseDTO(targetTask, res.data)
          : null;
        if (reconciledTask) {
          onReconcileTask?.(reconciledTask);
          onTaskUpdatedInDetails?.(reconciledTask);
        }
        notifyTasksChanged();

        if (completed) {
          const completionLabel =
            targetTask.type?.toLowerCase() === "habit"
              ? t("habitCompleted")
              : targetTask.type?.toLowerCase() === "daily"
                ? t("dailyCompleted")
                : t("todoCompleted");

          // Proteção contra ganho múltiplo de Ouro/XP ao marcar e desmarcar a mesma tarefa/diária
          if (alreadyRewarded) {
            soundEffects.playTaskCompleteSound();
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

          rewardedTaskIdsRef.current.add(taskId);

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
            isPenaltyApplied: targetTask.isPenaltyApplied,
            locale,
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

          // Se não subiu de nível, executa o som e o toast padrão contextual ao tipo da atividade
          if (!rewardResult.didLevelUp) {
            soundEffects.playTaskCompleteSound();

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
          toast.info(t("markedPending"));
        }
      });
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
    ],
  );

  const handleHabitChange = useCallback(
    (taskId: string, delta: number) => {
      const targetTask = findTask(taskId);
      if (!targetTask) return;

      // Atualização otimista imediata na visualização do usuário
      onOptimisticHabit(taskId, delta);

      startTransition(async () => {
        const res = await recordHabitScore(taskId, delta);

        if (!res.success) {
          toast.error(res.error || t("habitScoreError"));
          // Rollback otimista revertendo o incremento ou decremento
          onOptimisticHabit(taskId, -delta);
          return;
        }

        // Reconcilia os contadores e streak exatos retornados pelo backend
        const reconciledTask = res.data
          ? mergeTaskWithResponseDTO(targetTask, res.data)
          : null;
        if (reconciledTask) {
          onReconcileTask?.(reconciledTask);
          onTaskUpdatedInDetails?.(reconciledTask);
        }
        notifyTasksChanged();

        if (delta > 0) {
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

          // Se não subiu de nível, executa o som e o toast padrão do hábito
          if (!rewardResult.didLevelUp) {
            soundEffects.playHabitSound();
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

          soundEffects.playPenaltySound();

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
      });
    },
    [
      findTask,
      onOptimisticHabit,
      onTaskUpdatedInDetails,
      onReconcileTask,
      t,
      tLevelUp,
      locale,
      xpLabel,
      goldLabel,
    ],
  );

  const handleDeleteTask = useCallback(
    async (task: Task, targetColumnId?: string, deleteHistory = false) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      onOptimisticDelete?.(task, colId);

      const res = await deleteTask(task.id, deleteHistory);
      if (!res.success) {
        onRollbackDelete?.(task, colId);
        toast.error(res.error || t("deleteError"));
        return;
      }

      notifyTasksChanged();
      toast.success(t("deleteSuccess", { title: task.title }));
    },
    [defaultColumnId, onOptimisticDelete, onRollbackDelete, t],
  );

  const handleDuplicateTask = useCallback(
    async (task: Task, targetColumnId?: string) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      if (!colId) {
        toast.error(t("duplicateColumnError"));
        return;
      }

      const payload = buildCreateTaskPayloadFromTask(task);
      const res = await createTask(colId, payload);
      if (!res.success) {
        toast.error(res.error || t("duplicateError"));
        return;
      }

      const newTaskId = res.data?.id;
      let clonedChecklist = task.checklist;

      if (newTaskId && task.checklist && task.checklist.length > 0) {
        const createdItems = await cloneTaskChecklistItems(
          newTaskId,
          task.checklist,
        );
        if (createdItems.length > 0) {
          clonedChecklist = createdItems;
        }
      }

      const duplicatedTask: Task = {
        ...task,
        id: newTaskId || `dup-${Date.now()}`,
        completed: false,
        hasClaimedReward: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        columnId: colId,
        order: 0,
        checklist: clonedChecklist,
      };

      onTaskDuplicated?.(duplicatedTask, colId);
      notifyTasksChanged();
      soundEffects.playCreateSound();
      toast.success(t("duplicateSuccess", { title: task.title }));
    },
    [defaultColumnId, onTaskDuplicated, t],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
    isPending,
  };
}
