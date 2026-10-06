"use client";

import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import type { BoardColumn, Task } from "@/types/task";

type SetColumns = Dispatch<SetStateAction<BoardColumn[]>>;

const findColumnByTask = (cols: BoardColumn[], taskId: UniqueIdentifier) =>
  cols.find((col) => col.tasks.some((t) => t.id === taskId));

/** Move uma tarefa para outra coluna (em tempo real, durante o arrasto). */
function moveTaskAcrossColumns(
  cols: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  isOverTask: boolean,
): BoardColumn[] {
  const from = findColumnByTask(cols, activeId);
  const to = isOverTask
    ? findColumnByTask(cols, overId)
    : cols.find((col) => col.id === overId);

  if (!from || !to || from.id === to.id) return cols;

  const task = from.tasks.find((t) => t.id === activeId);
  if (!task) return cols;

  const moving: Task = { ...task, columnId: to.id };
  const targetTasks = [...to.tasks];
  const overIndex = isOverTask
    ? targetTasks.findIndex((t) => t.id === overId)
    : -1;
  targetTasks.splice(
    overIndex >= 0 ? overIndex : targetTasks.length,
    0,
    moving,
  );

  return cols.map((col) => {
    if (col.id === from.id)
      return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
    if (col.id === to.id) return { ...col, tasks: targetTasks };
    return col;
  });
}

/** Reordena colunas e recalcula o `order` (índice esperado pelo backend). */
function reorderColumns(
  cols: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): BoardColumn[] {
  const oldIndex = cols.findIndex((c) => c.id === activeId);
  const newIndex = cols.findIndex((c) => c.id === overId);
  if (oldIndex === -1 || newIndex === -1) return cols;

  return arrayMove(cols, oldIndex, newIndex).map((col, order) => ({
    ...col,
    order,
  }));
}

/** Reordena tarefas dentro da mesma coluna. */
function reorderTasks(
  cols: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): BoardColumn[] {
  const col = findColumnByTask(cols, activeId);
  if (!col) return cols;

  const oldIndex = col.tasks.findIndex((t) => t.id === activeId);
  const newIndex = col.tasks.findIndex((t) => t.id === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return cols;

  const tasks = arrayMove(col.tasks, oldIndex, newIndex);
  return cols.map((c) => (c.id === col.id ? { ...c, tasks } : c));
}

export interface UseRoutineBoardDndOptions {
  columns?: BoardColumn[];
  setColumns: SetColumns;
  onTaskMove?: (
    taskId: string,
    targetColumnId: string,
    newOrderIndex: number,
    allTargetTasks?: Task[],
  ) => void;
  onColumnReorder?: (reorderedColumns: BoardColumn[]) => void;
}

/**
 * Toda a lógica de drag-and-drop (@dnd-kit) do quadro de rotina:
 * reordenar colunas, reordenar tarefas e mover tarefas entre colunas com callbacks de persistência.
 */
export function useRoutineBoardDnd(
  setColumnsOrOptions: SetColumns | UseRoutineBoardDndOptions,
  legacyOnTaskMove?: (
    taskId: string,
    targetColumnId: string,
    newOrderIndex: number,
  ) => void,
  legacyOnColumnReorder?: (reorderedColumns: BoardColumn[]) => void,
) {
  const isOptionsObject =
    typeof setColumnsOrOptions === "object" &&
    "setColumns" in setColumnsOrOptions;
  const setColumns = isOptionsObject
    ? setColumnsOrOptions.setColumns
    : setColumnsOrOptions;
  const onTaskMove = isOptionsObject
    ? setColumnsOrOptions.onTaskMove
    : legacyOnTaskMove;
  const onColumnReorder = isOptionsObject
    ? setColumnsOrOptions.onColumnReorder
    : legacyOnColumnReorder;
  const initialColumns = isOptionsObject
    ? setColumnsOrOptions.columns || []
    : [];

  const columnsRef = useRef<BoardColumn[]>(initialColumns);
  if (isOptionsObject && setColumnsOrOptions.columns) {
    columnsRef.current = setColumnsOrOptions.columns;
  }

  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current;
    setActiveColumn(data?.type === "Column" ? data.column : null);
    setActiveTask(data?.type === "Task" ? data.task : null);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "Task") return;

    const isOverTask = over.data.current?.type === "Task";
    setColumns((prev) => {
      const next = moveTaskAcrossColumns(prev, active.id, over.id, isOverTask);
      columnsRef.current = next;
      return next;
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);
    if (!over) return;

    const currentCols = columnsRef.current;
    const type = active.data.current?.type;

    if (type === "Column") {
      if (active.id !== over.id) {
        const next = reorderColumns(currentCols, active.id, over.id);
        columnsRef.current = next;
        setColumns(next);
        onColumnReorder?.(next);
      }
    } else if (type === "Task") {
      const next =
        active.id !== over.id
          ? reorderTasks(currentCols, active.id, over.id)
          : currentCols;

      columnsRef.current = next;
      setColumns(next);

      // Notifica callback de persistência FORA da função de atualização de estado do React
      const targetCol = next.find((c) =>
        c.tasks.some((t) => t.id === active.id),
      );
      if (targetCol) {
        const newIndex = targetCol.tasks.findIndex((t) => t.id === active.id);
        onTaskMove?.(
          String(active.id),
          targetCol.id,
          newIndex,
          targetCol.tasks,
        );
      }
    }
  };

  return {
    sensors,
    activeColumn,
    activeTask,
    handlers: { onDragStart, onDragOver, onDragEnd },
  };
}
