import type React from "react";

/**
 * Aciona um manipulador de menu de contexto a partir de um clique em botão de ações,
 * utilizando a posição do botão como fallback quando ativado via teclado (0, 0).
 */
export function openContextMenuFromButton<T extends HTMLElement = HTMLElement>(
  e: React.MouseEvent<HTMLButtonElement>,
  onContextMenu?: (e: React.MouseEvent<T>) => void,
): void {
  e.preventDefault();
  e.stopPropagation();
  if (!onContextMenu) return;

  const isKeyboardOrZero = e.clientX === 0 && e.clientY === 0;
  if (!isKeyboardOrZero) {
    onContextMenu(e as unknown as React.MouseEvent<T>);
    return;
  }

  const rect = e.currentTarget.getBoundingClientRect();
  const syntheticEvent = {
    ...e,
    clientX: Math.round(rect.right - 8),
    clientY: Math.round(rect.bottom + 4),
    currentTarget: e.currentTarget,
    target: e.target,
    preventDefault: () => e.preventDefault(),
    stopPropagation: () => e.stopPropagation(),
  } as unknown as React.MouseEvent<T>;

  onContextMenu(syntheticEvent);
}
