import type { Task } from "@/types/task";
import type { UseTaskProgressOptions } from "@/types/task-ui";

/**
 * Estado e ações de progresso de uma tarefa:
 * - `completed` para Diárias/Afazeres (checkbox)
 * - `habitScore` (+/-) para Hábitos
 *
 * Utiliza o estado derivado diretamente da prop `task` para garantir sincronização
 * instantânea sem efeitos colaterais de re-render ou loops de atualização no React.
 */
export function useTaskProgress(
  task: Task,
  { onToggle, onHabitChange }: UseTaskProgressOptions = {},
) {
  const completed = Boolean(task.completed);
  const habitScore = (task.positiveCount ?? 0) - (task.negativeCount ?? 0);

  const toggleCompleted = () => {
    const next = !completed;
    onToggle?.(task.id, next);
  };

  const changeHabit = (delta: number) => {
    onHabitChange?.(task.id, delta);
  };

  const isHabit = (task.type || "").toLowerCase() === "habit";

  return {
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    /** Afazeres/Diárias concluídos ficam esmaecidos e riscados. */
    isDone: completed && !isHabit,
  };
}
