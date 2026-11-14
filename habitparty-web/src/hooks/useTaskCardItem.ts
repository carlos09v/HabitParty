"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  getTaskBorderClass,
  normalizeTaskType,
  TASK_PRIORITY_META,
} from "@/constants/task";
import { useTaskProgress } from "@/hooks/useTaskProgress";
import type { AppLocale } from "@/i18n/config";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { Task } from "@/types/task";
import { getTaskDueDateInfo } from "@/utils/date";
import { getTagLeafLabel } from "@/utils/tags";

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
 * Hook leve de metadados e progresso da tarefa, SEM assinar o contexto `@dnd-kit/sortable`.
 * Ideal para linhas estáticas do Dashboard e overlays onde Drag-and-Drop não é necessário.
 */
export function useTaskItemMeta({
  task,
  isCompact: propIsCompact,
  onToggleCompleted,
  onHabitChange,
  activeFilter,
  selectedDate,
}: Omit<
  UseTaskCardItemOptions,
  "columnId" | "isOverlay" | "isSortable" | "useTranslateTransform"
>) {
  const locale = useLocale() as AppLocale;
  const dateFormat = useUIStore((state) => state.dateFormat);
  const timeFormat = useUIStore((state) => state.timeFormat);
  const userTimeZone = useUserStore((state) => state.user?.timezone);
  const isCompact = propIsCompact ?? false;

  const { completed, habitScore, toggleCompleted, changeHabit, isDone } =
    useTaskProgress(task, {
      onToggle: onToggleCompleted,
      onHabitChange,
    });

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";
  const isTodoEvent = Boolean(
    isTodo && (task.isAllDay || task.startTime || task.dueEndTime),
  );
  const dueDateInfo = getTaskDueDateInfo(task.dueDate, {
    activeFilter,
    selectedDate,
    locale,
    dueTime: task.dueTime,
    startTime: task.startTime,
    dueEndTime: task.dueEndTime,
    isAllDay: task.isAllDay,
    dateFormat,
    timeFormat,
    timeZone: userTimeZone,
  });
  const isTodoOverdue = Boolean(isTodo && dueDateInfo.isOverdue && !isDone);
  const borderClass = isTodoOverdue
    ? "border-l-danger-500 hover:border-l-danger-500"
    : getTaskBorderClass(task);

  const rawDisplayTag =
    task.tags && task.tags.length > 0
      ? task.tags[0]
      : task.category && task.category !== "Geral"
        ? task.category
        : null;

  const displayTag = rawDisplayTag ? getTagLeafLabel(rawDisplayTag) : null;
  const displayTagTitle = rawDisplayTag;

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
    isTodo && task.isHardcoreModeEnabled && dueDateInfo.isOverdue,
  );

  return {
    isCompact,
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    isDone,
    taskType,
    isHabit,
    isDaily,
    isTodo,
    isTodoEvent,
    borderClass,
    dueDateInfo,
    displayTag,
    displayTagTitle,
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

/**
 * Hook completo que combina `useTaskItemMeta` com `@dnd-kit/sortable` para cards e linhas arrastáveis no Kanban.
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
  const meta = useTaskItemMeta({
    task,
    isCompact: propIsCompact,
    onToggleCompleted,
    onHabitChange,
    activeFilter,
    selectedDate,
  });

  const sortableData = useMemo(
    () => ({
      type: "Task" as const,
      task,
      columnId,
    }),
    [task, columnId],
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: sortableData,
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

  return {
    ...meta,
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    style,
  };
}

/**
 * Hook que desambigua clique simples (ex: abrir detalhes) de duplo clique (ex: abrir edição)
 * usando um timer de 180ms limpo automaticamente na desmontagem.
 */
export function useDeferredSingleClick(delayMs = 180) {
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const clearPendingClick = useCallback(() => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, []);

  const triggerSingleClick = useCallback(
    (
      eventDetail: number,
      hasDoubleClickHandler: boolean,
      callback: () => void,
    ) => {
      if (eventDetail >= 2) {
        clearPendingClick();
        return;
      }
      if (hasDoubleClickHandler) {
        clearPendingClick();
        clickTimeoutRef.current = setTimeout(() => {
          clickTimeoutRef.current = null;
          callback();
        }, delayMs);
      } else {
        callback();
      }
    },
    [clearPendingClick, delayMs],
  );

  return {
    triggerSingleClick,
    clearPendingClick,
  };
}
