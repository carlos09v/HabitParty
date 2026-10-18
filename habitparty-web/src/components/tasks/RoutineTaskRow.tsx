"use client";

import { memo } from "react";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import type { RoutineTaskRowProps } from "@/types/task-ui";

/**
 * Linha de Tarefa arrastável para a visualização em Lista do quadro de tarefas (Kanban).
 * Reutiliza a implementação unificada do TaskRow com modo arrastável ativado (isSortable)
 * e adapta os callbacks de detalhes e menu de contexto com o columnId da lista.
 */
export const RoutineTaskRow = memo(function RoutineTaskRow({
  isSortable = true,
  columnId,
  onOpenDetails,
  onContextMenu,
  ...props
}: RoutineTaskRowProps) {
  return (
    <TaskRow
      {...props}
      columnId={columnId}
      isSortable={isSortable}
      onOpenDetails={
        onOpenDetails
          ? (task, anchorRect) => onOpenDetails(task, columnId, anchorRect)
          : undefined
      }
      onContextMenu={
        onContextMenu
          ? (e, task) => onContextMenu(e, task, columnId)
          : undefined
      }
    />
  );
});
