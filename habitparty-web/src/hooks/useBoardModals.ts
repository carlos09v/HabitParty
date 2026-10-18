"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardColumn, Task, TaskTypeOption } from "@/types/task";

interface UseBoardModalsOptions {
  initialOpenCreateColumn?: boolean;
  ensureColumnVisible?: (columnId: string) => void;
}

/**
 * Hook dedicado a gerenciar os modais, popovers e menus de contexto do quadro Kanban,
 * bem como a sincronização dos parâmetros de URL (?createColumn e ?columnId).
 */
export function useBoardModals({
  initialOpenCreateColumn = false,
  ensureColumnVisible,
}: UseBoardModalsOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Modal: Criar / Editar Coluna
  const [columnModalState, setColumnModalState] = useState<{
    isOpen: boolean;
    columnToEdit?: BoardColumn | null;
  }>({
    isOpen: initialOpenCreateColumn,
    columnToEdit: null,
  });

  useEffect(() => {
    if (
      initialOpenCreateColumn ||
      searchParams.get("createColumn") === "true"
    ) {
      setColumnModalState({ isOpen: true, columnToEdit: null });
    }
  }, [initialOpenCreateColumn, searchParams]);

  // Modal: Criar / Editar Tarefa
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    columnId?: string;
    defaultTaskType?: TaskTypeOption;
    initialTitle?: string;
    taskToEdit?: Task | null;
  }>({ isOpen: false, taskToEdit: null });

  // Popover: Detalhes Rápidos da Tarefa
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{
    task: Task;
    columnId: string;
    anchorRect?: DOMRect | null;
  } | null>(null);

  // Menu de Contexto (botão direito na tarefa)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
    columnId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
    columnId: null,
  });

  // Menu de Contexto da Coluna (3 pontos)
  const [columnContextMenu, setColumnContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    column: null,
  });

  // Modal: Excluir Coluna
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );

  // Coluna em foco/selecionada vinda exclusivamente da navegação do Dashboard (?columnId=...)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(() =>
    searchParams.get("columnId"),
  );
  const lastActiveColumnIdRef = useRef<string | null>(null);

  useEffect(() => {
    const colParam = searchParams.get("columnId");
    if (colParam) {
      if (lastActiveColumnIdRef.current !== colParam) {
        lastActiveColumnIdRef.current = colParam;
        setSelectedColumnId(colParam);
        ensureColumnVisible?.(colParam);
      }
    } else {
      lastActiveColumnIdRef.current = null;
      setSelectedColumnId(null);
    }
  }, [searchParams, ensureColumnVisible]);

  // Limpa o columnId da URL de forma segura com window.history e router do Next.js
  const clearColumnQueryParam = useCallback(() => {
    if (searchParams.get("columnId")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("columnId");
      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
      }
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  // Desseleciona a coluna ativa ao clicar fora dela ou pressionar Escape
  useEffect(() => {
    if (!selectedColumnId) return;

    // Aguarda um pequeno tick para evitar que o clique de navegação descarte imediatamente a seleção
    let isReady = false;
    const timer = setTimeout(() => {
      isReady = true;
    }, 200);

    const handlePointerDown = (e: PointerEvent) => {
      if (!isReady) return;

      const targetNode =
        e.target instanceof Element
          ? e.target
          : (e.target as Node | null)?.parentElement;

      // Se clicou dentro da coluna selecionada, mantém a borda ativa
      if (targetNode?.closest(`[data-column-id="${selectedColumnId}"]`)) {
        return;
      }

      // Se clicou em um modal, drawer, popover ou menu aberto, não desseleciona
      if (
        targetNode?.closest('[role="dialog"]') ||
        targetNode?.closest('[role="menu"]')
      ) {
        return;
      }

      // Se clicou fora da coluna selecionada: remove a borda e limpa a URL
      setSelectedColumnId(null);
      clearColumnQueryParam();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedColumnId(null);
        clearColumnQueryParam();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedColumnId, clearColumnQueryParam]);

  const handleOpenTaskContextMenu = useCallback(
    (e: React.MouseEvent, task: Task, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        task,
        columnId,
      });
    },
    [],
  );

  const handleOpenColumnContextMenu = useCallback(
    (e: React.MouseEvent, column: BoardColumn) => {
      e.preventDefault();
      e.stopPropagation();
      setColumnContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        column,
      });
    },
    [],
  );

  const closeColumnModal = useCallback(() => {
    setColumnModalState({ isOpen: false, columnToEdit: null });
    if (searchParams.get("createColumn") === "true") {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("createColumn");
      const qs = nextParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return {
    columnModalState,
    setColumnModalState,
    closeColumnModal,
    taskModalState,
    setTaskModalState,
    selectedTaskDetails,
    setSelectedTaskDetails,
    contextMenu,
    setContextMenu,
    columnContextMenu,
    setColumnContextMenu,
    columnToDelete,
    setColumnToDelete,
    selectedColumnId,
    setSelectedColumnId,
    handleOpenTaskContextMenu,
    handleOpenColumnContextMenu,
  };
}
