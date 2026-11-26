import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { normalizeTaskType } from "@/constants/task";
import type { BoardColumn, Task } from "@/types/task";

/** Identifica se uma tarefa pertence à seção separada de Afazeres (To-Dos) concluídos. */
export function isCompletedTodoSectionTask(task: Task): boolean {
  return normalizeTaskType(task) === "todo" && Boolean(task.completed);
}

export function reindexTasksOrder(tasks: Task[]): Task[] {
  return tasks.map((task, idx) =>
    task.order === idx ? task : { ...task, order: idx },
  );
}

/** Localiza a coluna que contém uma determinada tarefa pelo ID. */
export function findColumnByTask(
  cols: BoardColumn[],
  taskId: UniqueIdentifier,
): BoardColumn | undefined {
  return cols.find((col) => col.tasks.some((t) => t.id === taskId));
}

/** Move uma tarefa para outra coluna (em tempo real, durante o arrasto) recalculando `order`. */
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
    if (col.id === from.id) {
      return {
        ...col,
        tasks: reindexTasksOrder(col.tasks.filter((t) => t.id !== activeId)),
      };
    }
    if (col.id === to.id) {
      return { ...col, tasks: reindexTasksOrder(targetTasks) };
    }
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
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return cols;

  return arrayMove(cols, oldIndex, newIndex).map((col, order) => ({
    ...col,
    order,
  }));
}

/** Reordena tarefas dentro da mesma coluna, bloqueando troca entre Ativas e Concluídas e atualizando `order`. */
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

  const activeTask = col.tasks[oldIndex];
  const overTask = col.tasks[newIndex];
  if (
    isCompletedTodoSectionTask(activeTask) !==
    isCompletedTodoSectionTask(overTask)
  ) {
    return cols;
  }

  const tasks = reindexTasksOrder(arrayMove(col.tasks, oldIndex, newIndex));
  return cols.map((c) => (c.id === col.id ? { ...c, tasks } : c));
}
