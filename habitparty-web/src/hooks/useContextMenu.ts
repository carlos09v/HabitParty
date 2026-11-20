"use client";

import { type MouseEvent, useCallback, useState } from "react";

export interface ContextMenuState<T> {
  isOpen: boolean;
  position: { x: number; y: number };
  data: T | null;
}

/**
 * Gerencia o estado flutuante (posição, abertura e payload alvo) de um ContextMenu.
 */
export function useContextMenu<T>() {
  const [state, setState] = useState<ContextMenuState<T>>({
    isOpen: false,
    position: { x: 0, y: 0 },
    data: null,
  });

  const openContextMenu = useCallback((e: MouseEvent, data: T) => {
    e.preventDefault();
    e.stopPropagation();
    setState({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      data,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu: state,
    openContextMenu,
    closeContextMenu,
  };
}
