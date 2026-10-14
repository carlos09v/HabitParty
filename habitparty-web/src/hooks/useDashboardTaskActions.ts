"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { changeTaskStatus, completeTask } from "@/actions/taskActions";
import { useUserStore } from "@/store/userStore";
import type { Task } from "@/types/task";
import { soundEffects } from "@/utils/soundEffects";

interface UseDashboardTaskActionsProps {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useDashboardTaskActions({
  setTasks,
}: UseDashboardTaskActionsProps) {
  const [, startTransition] = useTransition();
  const updateUserPartial = useUserStore((state) => state.updateUserPartial);

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      let targetTask: Task | undefined;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            targetTask = t;
            return { ...t, completed };
          }
          return t;
        }),
      );

      startTransition(async () => {
        const res = completed
          ? await completeTask(taskId)
          : await changeTaskStatus(taskId, "PENDING");

        if (!res.success) {
          toast.error(res.error || "Erro ao atualizar status da tarefa.");
          // Rollback
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, completed: !completed } : t,
            ),
          );
          return;
        }

        if (completed) {
          soundEffects.playTaskCompleteSound();
          toast.success("Tarefa concluída!");
          if (targetTask) {
            const gold = targetTask.rewardGold ?? 0;
            const xp = targetTask.rewardXp ?? 0;
            const currentUser = useUserStore.getState().user;
            if (currentUser) {
              updateUserPartial({
                currentCoins: (currentUser.currentCoins ?? 0) + gold,
                totalXp: (currentUser.totalXp ?? 0) + xp,
              });
            }
          }
        } else {
          toast.info("Tarefa marcada como pendente.");
        }
      });
    },
    [setTasks, updateUserPartial],
  );

  const handleHabitChange = useCallback(
    (taskId: string, delta: number) => {
      let targetTask: Task | undefined;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            targetTask = t;
            const nextPositive =
              delta > 0
                ? (t.positiveCount ?? 0) + delta
                : (t.positiveCount ?? 0);
            const nextNegative =
              delta < 0
                ? (t.negativeCount ?? 0) + Math.abs(delta)
                : (t.negativeCount ?? 0);
            return {
              ...t,
              positiveCount: nextPositive,
              negativeCount: nextNegative,
            };
          }
          return t;
        }),
      );

      if (delta > 0) {
        soundEffects.playHabitSound();
        startTransition(async () => {
          const res = await completeTask(taskId);
          if (!res.success) {
            toast.error(res.error || "Erro ao registrar hábito no servidor.");
            return;
          }

          toast.success("Hábito positivo registrado com sucesso!");
          if (targetTask) {
            const gold = targetTask.rewardGold ?? 0;
            const xp = targetTask.rewardXp ?? 0;
            const currentUser = useUserStore.getState().user;
            if (currentUser) {
              updateUserPartial({
                currentCoins: (currentUser.currentCoins ?? 0) + gold,
                totalXp: (currentUser.totalXp ?? 0) + xp,
              });
            }
          }
        });
      }
    },
    [setTasks, updateUserPartial],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
  };
}
