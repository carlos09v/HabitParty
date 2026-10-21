"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import {
  changeTaskStatus,
  completeTask,
  createTask,
  deleteTask,
  recordHabitScore,
} from "@/actions/taskActions";
import type { Task } from "@/types/task";
import {
  calculateTaskPenalty,
  formatCoins,
  getTaskRewardBreakdown,
} from "@/utils/economy";
import { awardUserRewards, deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";
import { buildCreateTaskPayloadFromTask } from "@/utils/taskMapper";

export interface UseTaskMutationsOptions {
  findTask: (taskId: string) => Task | undefined;
  onOptimisticToggle: (taskId: string, completed: boolean) => void;
  onOptimisticHabit: (taskId: string, delta: number) => void;
  onRollbackToggle: (taskId: string, previousCompleted: boolean) => void;
  onOptimisticDelete?: (task: Task, columnId?: string) => void;
  onRollbackDelete?: (task: Task, columnId?: string) => void;
  onTaskDuplicated?: (duplicatedTask: Task, targetColumnId: string) => void;
  onTaskUpdatedInDetails?: (task: Task) => void;
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
  defaultColumnId,
}: UseTaskMutationsOptions) {
  const [isPending, startTransition] = useTransition();

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      const targetTask = findTask(taskId);
      if (!targetTask) return;

      onOptimisticToggle(taskId, completed);
      onTaskUpdatedInDetails?.({ ...targetTask, completed });

      startTransition(async () => {
        const res = completed
          ? await completeTask(taskId)
          : await changeTaskStatus(taskId, "PENDING");

        if (!res.success) {
          toast.error(res.error || "Erro ao atualizar status da tarefa.");
          onRollbackToggle(taskId, !completed);
          onTaskUpdatedInDetails?.({ ...targetTask, completed: !completed });
          return;
        }

        if (completed) {
          const breakdown = getTaskRewardBreakdown({
            taskType: targetTask.type,
            difficulty: targetTask.difficulty,
            importanceType: targetTask.importanceType,
            repeatType: targetTask.repeatType,
            resetCounter: targetTask.resetCounter,
            currentStreak:
              targetTask.currentStreak ??
              targetTask.streak ??
              targetTask.positiveCount ??
              0,
            isHardcoreModeEnabled: targetTask.isHardcoreModeEnabled,
            dueDate: targetTask.dueDate,
            isPenaltyApplied: targetTask.isPenaltyApplied,
          });

          const xp = breakdown.finalReward.xp;
          const gold = breakdown.finalReward.gold;

          const rewardResult = awardUserRewards(xp, gold);

          // Se não subiu de nível, executa o som e o toast padrão contextual ao tipo da atividade
          if (!rewardResult.didLevelUp) {
            soundEffects.playTaskCompleteSound();
            const completionLabel =
              targetTask.type?.toLowerCase() === "habit"
                ? "Hábito concluído!"
                : targetTask.type?.toLowerCase() === "daily"
                  ? "Diária concluída!"
                  : "Tarefa concluída!";

            if (xp > 0 || gold > 0) {
              toast.success(
                <span>
                  {completionLabel} (<strong>+{xp} XP</strong> •{" "}
                  <strong>+{formatCoins(gold)} Ouro</strong>)
                  {breakdown.hasDecay && (
                    <span className="block text-[11px] text-neutral-400 mt-0.5 font-normal">
                      {targetTask.type?.toLowerCase() === "todo"
                        ? `${breakdown.stageLabel} (-${breakdown.decayPercentage}% por atraso)`
                        : `${breakdown.stageLabel} (-${breakdown.decayPercentage}% por rotina fixada)`}
                    </span>
                  )}
                </span>,
              );
            } else {
              toast.success(completionLabel);
            }
          }
        } else {
          toast.info("Tarefa marcada como pendente.");
        }
      });
    },
    [findTask, onOptimisticToggle, onRollbackToggle, onTaskUpdatedInDetails],
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
          toast.error(res.error || "Erro ao registrar pontuação do hábito.");
          // Rollback otimista revertendo o incremento ou decremento
          onOptimisticHabit(taskId, -delta);
          return;
        }

        // Se o painel de detalhes estiver aberto com essa tarefa, atualiza seus contadores
        if (res.data && onTaskUpdatedInDetails) {
          onTaskUpdatedInDetails({
            ...targetTask,
            positiveCount: res.data.positiveCount ?? targetTask.positiveCount,
            negativeCount: res.data.negativeCount ?? targetTask.negativeCount,
            streak: res.data.currentStreak ?? targetTask.streak,
            completed: res.data.status === "COMPLETED",
          });
        }

        if (delta > 0) {
          const breakdown = getTaskRewardBreakdown({
            taskType: targetTask.type,
            importanceType: targetTask.importanceType,
            resetCounter: targetTask.resetCounter,
            currentStreak:
              targetTask.currentStreak ??
              targetTask.streak ??
              targetTask.positiveCount ??
              0,
          });

          const xp = breakdown.finalReward.xp;
          const gold = breakdown.finalReward.gold;

          const rewardResult = awardUserRewards(xp, gold);

          // Se não subiu de nível, executa o som e o toast padrão do hábito
          if (!rewardResult.didLevelUp) {
            soundEffects.playHabitSound();
            if (xp > 0 || gold > 0) {
              toast.success(
                <span>
                  Hábito registrado! (<strong>+{xp} XP</strong> •{" "}
                  <strong>+{formatCoins(gold)} Ouro</strong>)
                  {breakdown.hasDecay && (
                    <span className="block text-[11px] text-neutral-400 mt-0.5 font-normal">
                      {breakdown.stageLabel} (-{breakdown.decayPercentage}% por
                      hábito consolidado)
                    </span>
                  )}
                </span>,
              );
            } else {
              toast.success("Hábito positivo registrado com sucesso!");
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
              Penalidade de hábito registrada! (
              <strong>-{penaltyResult.xpDeducted} XP</strong> •{" "}
              <strong>-{formatCoins(penaltyResult.coinsDeducted)} Ouro</strong>)
            </span>,
          );
        }
      });
    },
    [findTask, onOptimisticHabit, onTaskUpdatedInDetails],
  );

  const handleDeleteTask = useCallback(
    async (task: Task, targetColumnId?: string) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      onOptimisticDelete?.(task, colId);

      const res = await deleteTask(task.id);
      if (!res.success) {
        onRollbackDelete?.(task, colId);
        toast.error(res.error || "Erro ao excluir tarefa no servidor.");
        return;
      }

      toast.success(`Tarefa "${task.title}" excluída com sucesso!`);
    },
    [defaultColumnId, onOptimisticDelete, onRollbackDelete],
  );

  const handleDuplicateTask = useCallback(
    async (task: Task, targetColumnId?: string) => {
      const colId = targetColumnId || task.columnId || defaultColumnId;
      if (!colId) {
        toast.error("Coluna de destino não encontrada para duplicação.");
        return;
      }

      const payload = buildCreateTaskPayloadFromTask(task);
      const res = await createTask(colId, payload);
      if (!res.success) {
        toast.error(res.error || "Erro ao duplicar tarefa.");
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
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        columnId: colId,
        order: 0,
        checklist: clonedChecklist,
      };

      onTaskDuplicated?.(duplicatedTask, colId);
      soundEffects.playCreateSound();
      toast.success(`Tarefa "${task.title}" duplicada com sucesso!`);
    },
    [defaultColumnId, onTaskDuplicated],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
    isPending,
  };
}
