"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

export interface AnchoredPopoverOptions {
  preferredSide?: "left" | "right";
  popoverWidth?: number;
  popoverHeight?: number;
  margin?: number;
}

export function calculateAnchoredPosition(
  anchorRect: DOMRect | null | undefined,
  popoverHeight = 380,
  options: AnchoredPopoverOptions = {},
): { top: number; left: number } {
  if (typeof window === "undefined" || !anchorRect) {
    return { top: 0, left: 0 };
  }

  const { preferredSide = "right", popoverWidth = 340, margin = 12 } = options;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const effectiveWidth = Math.min(
    popoverWidth,
    Math.max(0, screenWidth - margin * 2),
  );

  let targetLeft =
    preferredSide === "left"
      ? anchorRect.left - effectiveWidth - margin
      : anchorRect.right + margin;

  // Se preferir à esquerda mas transbordar a borda esquerda, inverte para a direita
  if (preferredSide === "left" && targetLeft < margin) {
    targetLeft = anchorRect.right + margin;
  }
  // Se preferir à direita mas transbordar a borda direita, inverte para a esquerda
  else if (
    preferredSide === "right" &&
    targetLeft + effectiveWidth > screenWidth - margin
  ) {
    targetLeft = anchorRect.left - effectiveWidth - margin;
  }

  // Se o elemento âncora for largo (ex: linha da visualização em lista) e ambos os lados transbordarem
  if (targetLeft < margin) {
    targetLeft = Math.max(margin, screenWidth - effectiveWidth - margin);
  } else if (targetLeft + effectiveWidth > screenWidth - margin) {
    targetLeft = Math.max(margin, screenWidth - effectiveWidth - margin);
  }

  // Alinhamento vertical com o elemento âncora
  let targetTop = anchorRect.top;

  if (targetTop + popoverHeight > screenHeight - margin) {
    targetTop = Math.max(margin, screenHeight - popoverHeight - margin);
  }
  if (targetTop < margin) {
    targetTop = margin;
  }

  return { top: Math.round(targetTop), left: Math.round(targetLeft) };
}

/**
 * Hook universal para posicionamento de popovers e tooltips flutuantes ancorados a elementos.
 */
export function useAnchoredPopoverPosition(
  isOpen: boolean,
  anchorRect: DOMRect | null | undefined,
  popoverRef: RefObject<HTMLDivElement | null>,
  options: AnchoredPopoverOptions = {},
  mounted = true,
) {
  const {
    preferredSide = "right",
    popoverWidth = 340,
    popoverHeight = 380,
    margin = 12,
  } = options;

  const [position, setPosition] = useState<{ top: number; left: number }>(() =>
    anchorRect
      ? calculateAnchoredPosition(anchorRect, popoverHeight, {
          preferredSide,
          popoverWidth,
          popoverHeight,
          margin,
        })
      : { top: 0, left: 0 },
  );

  useLayoutEffect(() => {
    if (!isOpen || !anchorRect || !mounted) return;

    const actualHeight = popoverRef.current?.offsetHeight || popoverHeight;
    const nextPos = calculateAnchoredPosition(anchorRect, actualHeight, {
      preferredSide,
      popoverWidth,
      popoverHeight: actualHeight,
      margin,
    });

    setPosition((prev) => {
      if (prev.top === nextPos.top && prev.left === nextPos.left) {
        return prev;
      }
      return nextPos;
    });
  }, [
    isOpen,
    anchorRect,
    popoverRef,
    mounted,
    preferredSide,
    popoverWidth,
    popoverHeight,
    margin,
  ]);

  return position;
}
