"use client";

import { useState } from "react";
import type { Task } from "@/types/task";

interface UseTaskProgressOptions {
  onToggle?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
}

/**
 * Estado local de progresso de uma tarefa:
 * - `completed` para Diárias/Afazeres (checkbox)
 * - `habitScore` (+/-) para Hábitos
 */
export function useTaskProgress(
  task: Task,
  { onToggle, onHabitChange }: UseTaskProgressOptions = {},
) {
  const [completed, setCompleted] = useState(task.completed);
  const [habitScore, setHabitScore] = useState(
    (task.positiveCount ?? 0) - (task.negativeCount ?? 0),
  );

  const toggleCompleted = () => {
    const next = !completed;
    setCompleted(next);
    onToggle?.(task.id, next);
  };

  const changeHabit = (delta: number) => {
    setHabitScore((prev) => prev + delta);
    onHabitChange?.(task.id, delta);
  };

  return {
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    /** Afazeres/Diárias concluídos ficam esmaecidos e riscados. */
    isDone: completed && task.type !== "habit",
  };
}
