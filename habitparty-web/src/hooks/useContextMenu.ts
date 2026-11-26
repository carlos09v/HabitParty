"use client";

import { type MouseEvent, useCallback, useState } from "react";

export interface ContextMenuState<T> {
  isOpen: boolean;
  position: { x: number; y: number };
  data: T | null;
}

/**
 * Gerencia o estado flutuante (posição, abertura e payload alvo) de um ContextMenu,
 * suportando abertura por clique direito, coordenadas explícitas e toggle a partir de um botão.
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

  const openAtPosition = useCallback((x: number, y: number, data: T) => {
    setState({
      isOpen: true,
      position: { x, y },
      data,
    });
  }, []);

  const toggleFromButton = useCallback(
    (
      e: MouseEvent,
      data: T,
      isSameTarget?: (current: T | null, next: T) => boolean,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const position = { x: rect.left, y: rect.bottom + 4 };

      setState((prev) => {
        const same = isSameTarget
          ? isSameTarget(prev.data, data)
          : prev.data === data;
        if (prev.isOpen && same) {
          return { ...prev, isOpen: false };
        }
        return {
          isOpen: true,
          position,
          data,
        };
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu: state,
    openContextMenu,
    openAtPosition,
    toggleFromButton,
    closeContextMenu,
    setContextMenu: setState,
  };
}
