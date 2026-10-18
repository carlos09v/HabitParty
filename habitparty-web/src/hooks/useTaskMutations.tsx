"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import {
  changeTaskStatus,
  completeTask,
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

export interface UseTaskMutationsOptions {
  findTask: (taskId: string) => Task | undefined;
  onOptimisticToggle: (taskId: string, completed: boolean) => void;
  onOptimisticHabit: (taskId: string, delta: number) => void;
  onRollbackToggle: (taskId: string, previousCompleted: boolean) => void;
  onTaskUpdatedInDetails?: (task: Task) => void;
}

/**
 * Hook centralizado para mutações de status e hábitos de tarefas.
 * Elimina duplicação entre Kanban (useBoardTaskActions) e Dashboard (useDashboardTaskActions).
 * Orquestra: atualizações otimistas, sons, Server Actions, sonner toasts e sincronização do Zustand userStore.
 */
export function useTaskMutations({
  findTask,
  onOptimisticToggle,
  onOptimisticHabit,
  onRollbackToggle,
  onTaskUpdatedInDetails,
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

  return {
    handleToggleComplete,
    handleHabitChange,
    isPending,
  };
}
