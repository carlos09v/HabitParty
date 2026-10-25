import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { BoardColumn, Task } from "@/types/task";

/** Localiza a coluna que contém uma determinada tarefa pelo ID. */
export function findColumnByTask(
  cols: BoardColumn[],
  taskId: UniqueIdentifier,
): BoardColumn | undefined {
  return cols.find((col) => col.tasks.some((t) => t.id === taskId));
}

/** Move uma tarefa para outra coluna (em tempo real, durante o arrasto). */
export function moveTaskAcrossColumns(
  cols: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  isOverTask: boolean,
): BoardColumn[] {
  const from = findColumnByTask(cols, activeId);
  const to =
    cols.find((col) => col.id === overId) || findColumnByTask(cols, overId);

  if (!from || !to || from.id === to.id) return cols;

  const task = from.tasks.find((t) => t.id === activeId);
  if (!task) return cols;

  const moving: Task = { ...task, columnId: to.id };
  const targetTasks = to.tasks.filter((t) => t.id !== activeId);
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
export function reorderColumns(
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
export function reorderTasks(
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
