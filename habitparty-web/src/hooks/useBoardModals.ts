"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useTaskInteractionModals } from "@/hooks/useTaskInteractionModals";
import type { BoardColumn } from "@/types/task";
import type { ColumnInsertTarget } from "@/types/task-ui";
import { hasOpenModalDialog, isInsideAnyDialog } from "@/utils/portal";
import { replaceUrlSearchParams } from "@/utils/urlParams";

interface UseBoardModalsOptions {
  initialOpenCreateColumn?: boolean;
  ensureColumnVisible?: (columnId: string) => void;
  onCreateColumnParamRequest?: () => void;
}

function escapeCssAttributeValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}

/**
 * Hook dedicado a gerenciar os modais, popovers e menus de contexto do quadro Kanban,
 * bem como a sincronização dos parâmetros de URL (?createColumn e ?columnId).
 */
export function useBoardModals({
  initialOpenCreateColumn = false,
  ensureColumnVisible,
  onCreateColumnParamRequest,
}: UseBoardModalsOptions = {}) {
  const searchParams = useSearchParams();

  // Modal: Criar / Editar Coluna (inicia fechado para passar pela guarda de permissão/limite)
  const [columnModalState, setColumnModalState] = useState<{
    isOpen: boolean;
    columnToEdit?: BoardColumn | null;
    insertTarget?: ColumnInsertTarget | null;
  }>({
    isOpen: false,
    columnToEdit: null,
    insertTarget: null,
  });

  const onCreateColumnParamRequestRef = useLatestRef(
    onCreateColumnParamRequest,
  );

  const handledInitialCreateRef = useRef(false);
  const handledUrlCreateRef = useRef(false);
  const urlWantsCreateColumn = searchParams.get("createColumn") === "true";

  useEffect(() => {
    if (!urlWantsCreateColumn) {
      handledUrlCreateRef.current = false;
    }

    const shouldTriggerFromUrl =
      urlWantsCreateColumn && !handledUrlCreateRef.current;
    const shouldTriggerFromInitial =
      initialOpenCreateColumn && !handledInitialCreateRef.current;

    if (!shouldTriggerFromUrl && !shouldTriggerFromInitial) {
      return;
    }

    if (shouldTriggerFromUrl) {
      handledUrlCreateRef.current = true;
    }
    if (shouldTriggerFromInitial) {
      handledInitialCreateRef.current = true;
    }

    replaceUrlSearchParams((params) => {
      params.delete("createColumn");
    });

    if (onCreateColumnParamRequestRef.current) {
      onCreateColumnParamRequestRef.current();
    } else {
      setColumnModalState({
        isOpen: true,
        columnToEdit: null,
        insertTarget: null,
      });
    }
  }, [
    initialOpenCreateColumn,
    urlWantsCreateColumn,
    onCreateColumnParamRequestRef,
  ]);

  const {
    taskModalState,
    setTaskModalState,
    selectedTaskDetails,
    setSelectedTaskDetails,
    contextMenu,
    setContextMenu,
    handleOpenTaskContextMenu,
  } = useTaskInteractionModals();

  // Menu de Contexto da Coluna (3 pontos) reutilizando useContextMenu
  const {
    contextMenu: rawColumnMenu,
    openContextMenu: handleOpenColumnContextMenu,
    closeContextMenu: closeColumnContextMenu,
  } = useContextMenu<BoardColumn>();

  const columnContextMenu = useMemo(
    () => ({
      isOpen: rawColumnMenu.isOpen,
      position: rawColumnMenu.position,
      column: rawColumnMenu.data,
    }),
    [rawColumnMenu.data, rawColumnMenu.isOpen, rawColumnMenu.position],
  );

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

  // Limpa o columnId da URL preservando window.history.state sem disparar refetch RSC
  const clearColumnQueryParam = useCallback(() => {
    replaceUrlSearchParams((params) => {
      params.delete("columnId");
    });
  }, []);

  // Desseleciona a coluna ativa ao clicar fora dela ou pressionar Escape
  useEffect(() => {
    if (!selectedColumnId) return;

    const escapedColumnId = escapeCssAttributeValue(selectedColumnId);

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
      if (targetNode?.closest(`[data-column-id="${escapedColumnId}"]`)) {
        return;
      }

      // Se clicou em um modal, drawer, popover ou menu aberto, não desseleciona
      if (
        isInsideAnyDialog(targetNode) ||
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
        if (e.defaultPrevented || hasOpenModalDialog()) return;
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

  const closeColumnModal = useCallback(() => {
    setColumnModalState({
      isOpen: false,
      columnToEdit: null,
      insertTarget: null,
    });
    replaceUrlSearchParams((params) => {
      params.delete("createColumn");
    });
  }, []);

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
    closeColumnContextMenu,
    columnToDelete,
    setColumnToDelete,
    selectedColumnId,
    setSelectedColumnId,
    handleOpenTaskContextMenu,
    handleOpenColumnContextMenu,
  };
}
