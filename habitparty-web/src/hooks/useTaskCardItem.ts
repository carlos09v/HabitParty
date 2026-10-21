"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getTaskBorderClass,
  normalizeTaskType,
  TASK_PRIORITY_META,
} from "@/constants/task";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import { useUIStore } from "@/store/uiStore";
import type { Task } from "@/types/task";
import { getTaskDueDateInfo } from "@/utils/date";

export interface UseTaskCardItemOptions {
  task: Task;
  columnId?: string;
  isOverlay?: boolean;
  isSortable?: boolean;
  isCompact?: boolean;
  onToggleCompleted?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  useTranslateTransform?: boolean;
  activeFilter?: string;
  selectedDate?: string | null;
}

/**
 * Hook reutilizável que unifica toda a lógica compartilhada entre:
 * 1. RoutineTaskCard (Visualização em Card / Kanban)
 * 2. RoutineTaskRow (Visualização em Linha / Lista no Kanban)
 * 3. TaskRow (Visualização em Linha / Tabela no Dashboard)
 *
 * Centraliza: estado de progresso/streak, drag-and-drop sortable, normalização de tipo,
 * cores de borda/dificuldade, tags e cálculo de vencimento.
 */
export function useTaskCardItem({
  task,
  columnId,
  isOverlay = false,
  isSortable = true,
  isCompact: propIsCompact,
  onToggleCompleted,
  onHabitChange,
  useTranslateTransform = true,
  activeFilter,
  selectedDate,
}: UseTaskCardItemOptions) {
  const storeCompact = useUIStore((state) => state.compactMode);
  const isCompact = propIsCompact ?? storeCompact;

  const { completed, habitScore, toggleCompleted, changeHabit, isDone } =
    useTaskProgress(task, {
      onToggle: onToggleCompleted,
      onHabitChange,
    });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
      columnId,
    },
    disabled: isOverlay || !isSortable,
  });

  const style = isSortable
    ? {
        transform: useTranslateTransform
          ? CSS.Translate.toString(transform)
          : CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
      }
    : undefined;

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";
  const dueDateInfo = getTaskDueDateInfo(task.dueDate, {
    activeFilter,
    selectedDate,
  });
  const isTodoOverdue = Boolean(isTodo && dueDateInfo.isOverdue && !isDone);
  const borderClass = isTodoOverdue
    ? "border-l-danger-500 hover:border-l-danger-500"
    : getTaskBorderClass(task);

  const displayTag =
    task.tags && task.tags.length > 0
      ? task.tags[0]
      : task.category && task.category !== "Geral"
        ? task.category
        : null;

  const hasExtraTags = Boolean(task.tags && task.tags.length > 1);
  const extraTagsCount =
    task.tags && task.tags.length > 1 ? task.tags.length - 1 : 0;

  const priorityMeta =
    task.priority && (task.priority as string).toUpperCase() !== "NONE"
      ? TASK_PRIORITY_META[task.priority]
      : null;

  const checklistTotal = task.checklist?.length || 0;
  const checklistCompleted =
    task.checklist?.filter((item) => Boolean(item.isCompleted)).length || 0;
  const hasChecklist = checklistTotal > 0;
  const isChecklistAllDone =
    hasChecklist && checklistCompleted === checklistTotal;

  const isHardcoreOverdue = Boolean(
    task.isHardcoreModeEnabled && dueDateInfo.isOverdue,
  );

  return {
    isCompact,
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    isDone,
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    style,
    taskType,
    isHabit,
    isDaily,
    isTodo,
    borderClass,
    dueDateInfo,
    displayTag,
    hasExtraTags,
    extraTagsCount,
    priorityMeta,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    isChecklistAllDone,
    isHardcoreOverdue,
  };
}
