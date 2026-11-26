"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeTaskType } from "@/constants/task";
import type { BoardColumn, Task } from "@/types/task";
import { isTaskConsideredDone } from "@/utils/taskMapper";

/**
 * Particiona tarefas de uma coluna do quadro (ativas vs To-Dos concluídos),
 * calcula métricas de progresso (incluindo arquivadas) e gera listas separadas de IDs
 * para os `SortableContext`s de Ativas vs Concluídas — compartilhado entre `RoutineColumn` e `RoutineTaskList`.
 */
export function useRoutineColumnTasks(
  column: BoardColumn,
  forceExpandCompleted = false,
  activeDraggedTaskId: string | null = null,
) {
  const [userExpandedCompleted, setUserExpandedCompleted] = useState(false);
  const prevForceExpandRef = useRef(forceExpandCompleted);

  useEffect(() => {
    if (prevForceExpandRef.current && !forceExpandCompleted) {
      // Ao limpar o filtro de status === "completed", retorna ao estado recolhido pré-filtro
      setUserExpandedCompleted(false);
    }
    prevForceExpandRef.current = forceExpandCompleted;
  }, [forceExpandCompleted]);

  const isCompletedExpanded = forceExpandCompleted || userExpandedCompleted;

  const toggleCompletedExpanded = useCallback(() => {
    setUserExpandedCompleted((prev) => !prev);
  }, []);

  const archivedTotalCount = column.archivedTotalCount ?? 0;
  const archivedCompletedCount = column.archivedCompletedCount ?? 0;

  const { activeTasks, completedTodoTasks } = useMemo(() => {
    const active: Task[] = [];
    const completedTodos: Task[] = [];
    for (const taskItem of column.tasks) {
      if (normalizeTaskType(taskItem) === "todo" && taskItem.completed) {
        completedTodos.push(taskItem);
      } else {
        active.push(taskItem);
      }
    }
    return { activeTasks: active, completedTodoTasks: completedTodos };
  }, [column.tasks]);

  const draggedCompletedTask = useMemo(
    () =>
      !isCompletedExpanded && activeDraggedTaskId
        ? completedTodoTasks.find((item) => item.id === activeDraggedTaskId)
        : undefined,
    [activeDraggedTaskId, completedTodoTasks, isCompletedExpanded],
  );

  const activeTaskIds = useMemo(
    () => activeTasks.map((item) => item.id),
    [activeTasks],
  );

  const completedTaskIds = useMemo(() => {
    if (isCompletedExpanded) {
      return completedTodoTasks.map((item) => item.id);
    }
    return draggedCompletedTask ? [draggedCompletedTask.id] : [];
  }, [completedTodoTasks, draggedCompletedTask, isCompletedExpanded]);

  const taskIds = useMemo(
    () => [...activeTaskIds, ...completedTaskIds],
    [activeTaskIds, completedTaskIds],
  );

  const { totalTasks, completedTasks, progressPercent, isAllDone } =
    useMemo(() => {
      const total = column.tasks.length + archivedTotalCount;
      if (total === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          progressPercent: 0,
          isAllDone: false,
        };
      }
      const loadedDone = column.tasks.filter(isTaskConsideredDone).length;
      const done = loadedDone + archivedCompletedCount;
      return {
        totalTasks: total,
        completedTasks: done,
        progressPercent: Math.round((done / total) * 100),
        isAllDone: done === total,
      };
    }, [column.tasks, archivedTotalCount, archivedCompletedCount]);

  const hasCompletedSection =
    completedTodoTasks.length > 0 || archivedCompletedCount > 0;
  const isCompletelyEmpty =
    column.tasks.length === 0 && archivedCompletedCount === 0;

  return {
    isCompletedExpanded,
    toggleCompletedExpanded,
    archivedTotalCount,
    archivedCompletedCount,
    activeTasks,
    completedTodoTasks,
    draggedCompletedTask,
    activeTaskIds,
    completedTaskIds,
    taskIds,
    totalTasks,
    completedTasks,
    progressPercent,
    isAllDone,
    hasCompletedSection,
    isCompletelyEmpty,
  };
}
