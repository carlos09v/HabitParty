import { type RefObject, useLayoutEffect, useState } from "react";

export function useTaskDetailsPosition(
  isOpen: boolean,
  anchorRect: DOMRect | null | undefined,
  popoverRef: RefObject<HTMLDivElement | null>,
) {
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !anchorRect || !popoverRef.current) return;

    const popoverWidth = 360;
    const margin = 12;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Default: ancorado à direita do card
    let targetLeft = anchorRect.right + margin;

    // Se transbordar para a direita, inverte para a esquerda do card
    if (targetLeft + popoverWidth > screenWidth - margin) {
      targetLeft = anchorRect.left - popoverWidth - margin;
    }

    // Garante que não transborde a borda esquerda da tela
    if (targetLeft < margin) {
      targetLeft = Math.max(margin, screenWidth - popoverWidth - margin);
    }

    // Alinha topo com o topo do card, contido verticalmente no viewport
    const popoverHeight = popoverRef.current.offsetHeight || 420;
    let targetTop = anchorRect.top;

    if (targetTop + popoverHeight > screenHeight - margin) {
      targetTop = Math.max(margin, screenHeight - popoverHeight - margin);
    }
    if (targetTop < margin) {
      targetTop = margin;
    }

    setPopoverPosition({ top: targetTop, left: targetLeft });
  }, [isOpen, anchorRect, popoverRef]);

  return popoverPosition;
}
