"use client";

import {
  type CollisionDetection,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useLatestRef } from "@/hooks/useLatestRef";
import type { BoardColumn, Task } from "@/types/task";
import {
  findColumnByTask,
  moveTaskAcrossColumns,
  reorderColumns,
  reorderTasks,
} from "@/utils/boardDnd";

type SetColumns = Dispatch<SetStateAction<BoardColumn[]>>;

export interface UseRoutineBoardDndOptions {
  /** Colunas exibidas (possivelmente filtradas) — usadas para colisão visual. */
  columns?: BoardColumn[];
  /** Colunas mestre (não filtradas) — usadas para snapshot, mutação, rollback e persistência. */
  allColumns?: BoardColumn[];
  setColumns: SetColumns;
  /** Desabilita qualquer mutação via drag-and-drop (ex: workspace excedente em modo somente leitura). */
  disabled?: boolean;
  onDisabledInteraction?: () => void;
  onTaskMove?: (
    taskId: string,
    targetColumnId: string,
    newOrderIndex: number,
    allTargetTasks?: Task[],
    previousColumns?: BoardColumn[],
  ) => void;
  onColumnReorder?: (
    reorderedColumns: BoardColumn[],
    previousColumns?: BoardColumn[],
  ) => void;
  onHideColumn?: (columnId: string) => void;
}

/**
 * Toda a lógica de drag-and-drop (@dnd-kit) do quadro de rotina:
 * reordenar colunas, reordenar tarefas e mover tarefas entre colunas com callbacks de persistência.
 * Opera sempre sobre `allColumns` (estado mestre) para jamais apagar tarefas filtradas ao arrastar.
 */
export function useRoutineBoardDnd({
  columns = [],
  allColumns,
  setColumns,
  disabled = false,
  onDisabledInteraction,
  onTaskMove,
  onColumnReorder,
  onHideColumn,
}: UseRoutineBoardDndOptions) {
  const displayColumnsRef = useRef<BoardColumn[]>(columns);
  const masterColumns = allColumns ?? columns;
  const masterColumnsRef = useRef<BoardColumn[]>(masterColumns);
  const onDisabledInteractionRef = useLatestRef(onDisabledInteraction);
  const onTaskMoveRef = useLatestRef(onTaskMove);
  const onColumnReorderRef = useLatestRef(onColumnReorder);
  const onHideColumnRef = useLatestRef(onHideColumn);

  useIsomorphicLayoutEffect(() => {
    displayColumnsRef.current = columns;
    masterColumnsRef.current = masterColumns;
  }, [columns, masterColumns]);

  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const activeDragTypeRef = useRef<"Column" | "Task" | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);
  const initialDragColumnsRef = useRef<BoardColumn[] | null>(null);
  const initialTaskPositionRef = useRef<{
    columnId: string;
    index: number;
  } | null>(null);

  const sensors = useDndSensors();

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
    const dragType =
      args.active.data.current?.type ?? activeDragTypeRef.current;
    if (dragType === "Column") {
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
      const currentCols = displayColumnsRef.current;
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

  const resetDragState = useCallback(() => {
    activeDragTypeRef.current = null;
    setActiveColumn(null);
    setActiveTask(null);
    lastOverIdRef.current = null;
    recentlyMovedToNewContainer.current = false;
    initialDragColumnsRef.current = null;
    initialTaskPositionRef.current = null;
  }, []);

  const onDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      if (disabled) {
        onDisabledInteractionRef.current?.();
        resetDragState();
        return;
      }

      const data = active.data.current;
      const dragType =
        data?.type === "Column"
          ? "Column"
          : data?.type === "Task"
            ? "Task"
            : null;
      activeDragTypeRef.current = dragType;
      setActiveColumn(dragType === "Column" ? data?.column : null);
      setActiveTask(dragType === "Task" ? data?.task : null);
      lastOverIdRef.current = null;
      recentlyMovedToNewContainer.current = false;
      initialDragColumnsRef.current = masterColumnsRef.current;

      if (dragType === "Task") {
        const startCol = findColumnByTask(masterColumnsRef.current, active.id);
        const startIdx = startCol
          ? startCol.tasks.findIndex((t) => t.id === active.id)
          : -1;
        initialTaskPositionRef.current =
          startCol && startIdx >= 0
            ? { columnId: startCol.id, index: startIdx }
            : null;
      } else {
        initialTaskPositionRef.current = null;
      }
    },
    [disabled, onDisabledInteractionRef, resetDragState],
  );

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (disabled || !over || active.id === over.id) return;
      const dragType = active.data.current?.type ?? activeDragTypeRef.current;
      if (dragType !== "Task") return;

      const currentCols = masterColumnsRef.current;
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
        const next = moveTaskAcrossColumns(
          prev,
          active.id,
          over.id,
          isOverTask,
        );
        masterColumnsRef.current = next;
        return next;
      });
    },
    [disabled, setColumns],
  );

  const onDragCancel = useCallback(() => {
    if (initialDragColumnsRef.current) {
      masterColumnsRef.current = initialDragColumnsRef.current;
      setColumns(initialDragColumnsRef.current);
    }
    resetDragState();
  }, [resetDragState, setColumns]);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      const previousColumns =
        initialDragColumnsRef.current ?? masterColumnsRef.current;
      const initialTaskPos = initialTaskPositionRef.current;
      const type = active.data.current?.type ?? activeDragTypeRef.current;
      resetDragState();

      if (disabled) {
        return;
      }

      if (!over) {
        // Se onDragOver já moveu o card para outra coluna e o usuário soltou fora de qualquer alvo,
        // reverte para o snapshot inicial evitando inconsistência local vs backend.
        if (previousColumns !== masterColumnsRef.current) {
          masterColumnsRef.current = previousColumns;
          setColumns(previousColumns);
        }
        return;
      }

      const currentCols = masterColumnsRef.current;

      if (type === "Column") {
        if (
          over.id === "store-column-button" ||
          over.data.current?.type === "ColumnStoreButton"
        ) {
          onHideColumnRef.current?.(String(active.id));
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
          masterColumnsRef.current = next;
          setColumns(next);
          onColumnReorderRef.current?.(next, previousColumns);
        }
      } else if (type === "Task") {
        const fromCol = findColumnByTask(currentCols, active.id);
        const toCol =
          currentCols.find((c) => c.id === over.id) ||
          findColumnByTask(currentCols, over.id);

        if (!fromCol || !toCol) {
          if (previousColumns !== currentCols) {
            masterColumnsRef.current = previousColumns;
            setColumns(previousColumns);
          }
          return;
        }

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

        const targetCol = next.find((c) =>
          c.tasks.some((t) => t.id === active.id),
        );
        if (!targetCol) return;

        const newIndex = targetCol.tasks.findIndex((t) => t.id === active.id);

        // Evita setColumns e Server Action moveTasks quando o card volta exatamente à posição original
        if (
          initialTaskPos &&
          targetCol.id === initialTaskPos.columnId &&
          newIndex === initialTaskPos.index
        ) {
          if (next !== masterColumnsRef.current) {
            masterColumnsRef.current = previousColumns;
            setColumns(previousColumns);
          }
          return;
        }

        masterColumnsRef.current = next;
        setColumns(next);

        // Notifica callback de persistência FORA da função de atualização de estado do React
        onTaskMoveRef.current?.(
          String(active.id),
          targetCol.id,
          newIndex,
          targetCol.tasks,
          previousColumns,
        );
      }
    },
    [
      disabled,
      onColumnReorderRef,
      onHideColumnRef,
      onTaskMoveRef,
      resetDragState,
      setColumns,
    ],
  );

  const handlers = useMemo(
    () => ({ onDragStart, onDragOver, onDragEnd, onDragCancel }),
    [onDragStart, onDragOver, onDragEnd, onDragCancel],
  );

  return useMemo(
    () => ({
      sensors,
      activeColumn,
      activeTask,
      collisionDetection,
      handlers,
    }),
    [sensors, activeColumn, activeTask, collisionDetection, handlers],
  );
}
