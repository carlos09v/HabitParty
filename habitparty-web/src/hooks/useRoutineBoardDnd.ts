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
import { type Dispatch, type SetStateAction, useState } from "react";
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

/**
 * Toda a lógica de drag-and-drop (@dnd-kit) do quadro de rotina:
 * reordenar colunas, reordenar tarefas e mover tarefas entre colunas.
 */
export function useRoutineBoardDnd(setColumns: SetColumns) {
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
    setColumns((prev) =>
      moveTaskAcrossColumns(prev, active.id, over.id, isOverTask),
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const type = active.data.current?.type;
    if (type === "Column") {
      setColumns((prev) => reorderColumns(prev, active.id, over.id));
    } else if (type === "Task") {
      setColumns((prev) => reorderTasks(prev, active.id, over.id));
    }
  };

  return {
    sensors,
    activeColumn,
    activeTask,
    handlers: { onDragStart, onDragOver, onDragEnd },
  };
}
