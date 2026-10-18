"use client";

import {
  type CollisionDetection,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import type { BoardColumn, Task } from "@/types/task";

type SetColumns = Dispatch<SetStateAction<BoardColumn[]>>;

/**
 * Estratégia de detecção de colisão dedicada:
 * Quando arrastando uma Coluna, detecta colisões EXCLUSIVAMENTE contra outras Colunas.
 */
export const routineBoardCollisionDetection: CollisionDetection = (args) => {
  if (args.active.data.current?.type === "Column") {
    const columnContainers = args.droppableContainers.filter(
      (c) => c.data.current?.type === "Column",
    );
    return closestCenter({
      ...args,
      droppableContainers: columnContainers,
    });
  }

  const candidateContainers = args.droppableContainers.filter(
    (c) => c.id !== args.active.id,
  );

  const pointerCollisions = pointerWithin({
    ...args,
    droppableContainers: candidateContainers,
  });
  const intersections =
    pointerCollisions.length > 0
      ? pointerCollisions
      : rectIntersection({
          ...args,
          droppableContainers: candidateContainers,
        });
  const overId = getFirstCollision(intersections, "id");
  if (overId != null) return [{ id: overId }];

  return closestCenter({
    ...args,
    droppableContainers: candidateContainers,
  });
};

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
  onHideColumn?: (columnId: string) => void;
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
  const onHideColumn = isOptionsObject
    ? setColumnsOrOptions.onHideColumn
    : undefined;
  const initialColumns = isOptionsObject
    ? setColumnsOrOptions.columns || []
    : [];

  const columnsRef = useRef<BoardColumn[]>(initialColumns);
  if (isOptionsObject && setColumnsOrOptions.columns) {
    columnsRef.current = setColumnsOrOptions.columns;
  }

  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const initialDragColumnsRef = useRef<BoardColumn[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * Estratégia de colisão inteligente para Kanban:
   * 1. Colunas: detecta colisões exclusivamente contra outras Colunas pelo centro.
   * 2. Tarefas:
   *    - Ignora colisões transitórias imediatas caso o card tenha acabado de cruzar de coluna (recentlyMovedToNewContainer)
   *      para evitar oscilação infinita por layout shift imediato.
   *    - Filtra o próprio card ativo das opções droppables para evitar auto-colisão (distância 0 para si mesmo).
   *    - Usa pointerWithin para detectar a coluna ou tarefa sob a ponta do cursor imediatamente.
   *    - Se o cursor estiver sobre uma coluna com tarefas, detecta a tarefa mais próxima dentro dela via closestCenter.
   *    - Fallback suave: preserva o último alvo válido (lastOverIdRef) ao cruzar frestas entre colunas.
   */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // 1. Ao arrastar uma Coluna: detecta colisão prioritária no botão de guardar ou contra outras Colunas pelo centro
    if (args.active.data.current?.type === "Column") {
      const storeButton = args.droppableContainers.find(
        (c) =>
          c.id === "store-column-button" ||
          c.data.current?.type === "ColumnStoreButton",
      );

      if (storeButton) {
        const pointerOverStore = pointerWithin({
          ...args,
          droppableContainers: [storeButton],
        });
        if (pointerOverStore.length > 0) {
          return [{ id: storeButton.id }];
        }
      }

      const columnContainers = args.droppableContainers.filter(
        (c) => c.data.current?.type === "Column",
      );
      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }

    // Se o item acabou de se mover para outra coluna no dragOver,
    // mantém a colisão no último container válido para evitar flicker/oscilação
    // causada pelo layout shift imediato
    if (recentlyMovedToNewContainer.current) {
      if (lastOverIdRef.current) {
        return [{ id: lastOverIdRef.current }];
      }
    }

    // 2. Ao arrastar uma Tarefa:
    // Filtra o próprio container ativo para evitar auto-colisão (distância 0 para si mesmo)
    // e filtra o botão de guardar colunas (pois tarefas não podem ser guardadas no botão de colunas)
    const candidateContainers = args.droppableContainers.filter(
      (container) =>
        container.id !== args.active.id &&
        container.id !== "store-column-button" &&
        container.data.current?.type !== "ColumnStoreButton",
    );

    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: candidateContainers,
    });
    const intersections =
      pointerCollisions.length > 0
        ? pointerCollisions
        : rectIntersection({
            ...args,
            droppableContainers: candidateContainers,
          });

    let overId = getFirstCollision(intersections, "id");

    if (overId != null) {
      const currentCols = columnsRef.current;
      const targetColumn = currentCols.find((col) => col.id === overId);

      // Se o cursor estiver diretamente sobre o container de uma Coluna (vazia ou espaço livre)
      if (targetColumn) {
        const colTasks = targetColumn.tasks || [];

        // Se essa coluna possui outras tarefas, encontra a tarefa mais próxima dentro DELA
        if (colTasks.length > 0) {
          const taskIdsInCol = new Set(colTasks.map((t) => t.id));
          const taskContainersInCol = candidateContainers.filter(
            (container) =>
              container.id !== overId &&
              taskIdsInCol.has(container.id as string),
          );

          if (taskContainersInCol.length > 0) {
            const closestTaskCollision = closestCenter({
              ...args,
              droppableContainers: taskContainersInCol,
            });
            if (closestTaskCollision.length > 0) {
              overId = closestTaskCollision[0].id;
            }
          }
        }
      }

      lastOverIdRef.current = overId;
      return [{ id: overId }];
    }

    // 3. Fallback suave: preserva o último alvo válido ao cruzar frestas entre colunas
    if (lastOverIdRef.current) {
      return [{ id: lastOverIdRef.current }];
    }

    return closestCenter({
      ...args,
      droppableContainers: candidateContainers,
    });
  }, []);

  const onDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current;
    setActiveColumn(data?.type === "Column" ? data.column : null);
    setActiveTask(data?.type === "Task" ? data.task : null);
    lastOverIdRef.current = null;
    recentlyMovedToNewContainer.current = false;
    initialDragColumnsRef.current = columnsRef.current;
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "Task") return;

    const currentCols = columnsRef.current;
    const fromCol = findColumnByTask(currentCols, active.id);
    const toCol =
      currentCols.find((col) => col.id === over.id) ||
      findColumnByTask(currentCols, over.id);

    // Se não encontrou as colunas de origem e destino, ou se já estão na mesma coluna,
    // não faz nada: o @dnd-kit cuida das animações visuais intra-coluna sem disparar re-renders de estado
    if (!fromCol || !toCol || fromCol.id === toCol.id) return;

    const isOverTask =
      over.data.current?.type === "Task" ||
      Boolean(findColumnByTask(currentCols, over.id));

    recentlyMovedToNewContainer.current = true;
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });

    setColumns((prev) => {
      const next = moveTaskAcrossColumns(prev, active.id, over.id, isOverTask);
      columnsRef.current = next;
      return next;
    });
  };

  const onDragCancel = () => {
    if (initialDragColumnsRef.current) {
      columnsRef.current = initialDragColumnsRef.current;
      setColumns(initialDragColumnsRef.current);
    }
    setActiveColumn(null);
    setActiveTask(null);
    lastOverIdRef.current = null;
    recentlyMovedToNewContainer.current = false;
    initialDragColumnsRef.current = null;
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);
    lastOverIdRef.current = null;
    recentlyMovedToNewContainer.current = false;
    initialDragColumnsRef.current = null;
    if (!over) return;

    const currentCols = columnsRef.current;
    const type = active.data.current?.type;

    if (type === "Column") {
      if (
        over.id === "store-column-button" ||
        over.data.current?.type === "ColumnStoreButton"
      ) {
        onHideColumn?.(String(active.id));
        return;
      }

      let targetOverColId = over.id;
      if (over.data.current?.type !== "Column") {
        const colOfTask = findColumnByTask(currentCols, over.id);
        if (colOfTask) {
          targetOverColId = colOfTask.id;
        }
      }

      if (active.id !== targetOverColId) {
        const next = reorderColumns(currentCols, active.id, targetOverColId);
        columnsRef.current = next;
        setColumns(next);
        onColumnReorder?.(next);
      }
    } else if (type === "Task") {
      const fromCol = findColumnByTask(currentCols, active.id);
      const toCol =
        currentCols.find((c) => c.id === over.id) ||
        findColumnByTask(currentCols, over.id);

      if (!fromCol || !toCol) return;

      let next = currentCols;
      if (fromCol.id !== toCol.id) {
        const isOverTask =
          toCol.tasks.some((t) => t.id === over.id) ||
          over.data.current?.type === "Task";
        next = moveTaskAcrossColumns(
          currentCols,
          active.id,
          over.id,
          isOverTask,
        );
      } else if (active.id !== over.id) {
        next = reorderTasks(currentCols, active.id, over.id);
      }

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
    collisionDetection,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
