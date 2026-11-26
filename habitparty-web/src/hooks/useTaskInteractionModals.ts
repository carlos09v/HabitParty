"use client";

import { useCallback, useState } from "react";
import type { Task, TaskTypeOption } from "@/types/task";
import type { InitialTaskFormData } from "@/types/task-ui";

export interface TaskModalState {
  isOpen: boolean;
  columnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  initialValues?: InitialTaskFormData;
  taskToEdit?: Task | null;
}

export interface TaskDetailsSelection<TColumnId = string | undefined> {
  task: Task;
  columnId: TColumnId;
  anchorRect?: DOMRect | null;
}

export interface TaskContextMenuState<TColumnId = string | null> {
  isOpen: boolean;
  position: { x: number; y: number };
  task: Task | null;
  columnId: TColumnId;
}

/**
 * Estado e handlers compartilhados de interação com tarefas (modal de criação/edição,
 * popover de detalhes rápidos e menu de contexto), reutilizados pelo Dashboard e pelo Kanban.
 */
export function useTaskInteractionModals() {
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    isOpen: false,
    taskToEdit: null,
  });

  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{
    task: Task;
    columnId?: string;
    anchorRect?: DOMRect | null;
  } | null>(null);

  const [contextMenu, setContextMenu] = useState<TaskContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
    columnId: null,
  });

  const handleOpenTaskContextMenu = useCallback(
    (e: React.MouseEvent, task: Task, columnId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      const isKeyboardOrZero = e.clientX === 0 && e.clientY === 0;
      const anchorRect =
        isKeyboardOrZero && e.currentTarget instanceof Element
          ? e.currentTarget.getBoundingClientRect()
          : null;
      const position = anchorRect
        ? {
            x: Math.round(anchorRect.right - 8),
            y: Math.round(anchorRect.bottom + 4),
          }
        : { x: e.clientX, y: e.clientY };

      setContextMenu({
        isOpen: true,
        position,
        task,
        columnId: columnId ?? task.columnId ?? null,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleOpenTaskDetails = useCallback(
    (task: Task, columnId?: string, anchorRect?: DOMRect) => {
      setSelectedTaskDetails({
        task,
        columnId: columnId ?? task.columnId,
        anchorRect,
      });
    },
    [],
  );

  const closeTaskDetails = useCallback(() => {
    setSelectedTaskDetails(null);
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskModalState({
      isOpen: false,
      taskToEdit: null,
      columnId: undefined,
    });
  }, []);

  return {
    taskModalState,
    setTaskModalState,
    closeTaskModal,
    selectedTaskDetails,
    setSelectedTaskDetails,
    handleOpenTaskDetails,
    closeTaskDetails,
    contextMenu,
    setContextMenu,
    handleOpenTaskContextMenu,
    closeContextMenu,
  };
}
