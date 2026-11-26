"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
} from "react";
import { lockBodyScroll } from "@/utils/bodyScrollLock";
import { promoteToastLayer } from "@/utils/portal";

export interface UseNativeModalDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  preventClose?: boolean;
}

/**
 * Hook compartilhado para modais e drawers baseados em `<dialog>` nativo (`showModal()`).
 * Centraliza abertura/fechamento na Top Layer, scroll lock com contagem de referência,
 * promoção da camada de toasts acima do modal, fechamento por clique no backdrop (sem interferir
 * em popovers portados dentro do `<dialog>`) e tratamento de `Escape` / `cancel`.
 */
export function useNativeModalDialog({
  isOpen,
  onClose,
  preventClose = false,
}: UseNativeModalDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerDownOnBackdropRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        promoteToastLayer();
      }
      const unlockScroll = lockBodyScroll();
      return () => {
        unlockScroll();
        if (dialog.open) {
          dialog.close();
        }
      };
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (!preventClose) {
      onClose();
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "Escape" && preventClose) {
      e.preventDefault();
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDialogElement>) => {
    // Apenas cliques diretos no backdrop (<dialog>) iniciam fechamento;
    // cliques no painel interno ou em dropdowns/popovers portados para dentro do <dialog> têm target !== dialogRef.current.
    pointerDownOnBackdropRef.current =
      e.button === 0 && e.target === dialogRef.current;
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDialogElement>) => {
    if (
      e.button === 0 &&
      !preventClose &&
      pointerDownOnBackdropRef.current &&
      e.target === dialogRef.current
    ) {
      onClose();
    }
    pointerDownOnBackdropRef.current = false;
  };

  return {
    dialogRef,
    dialogEventHandlers: {
      onCancel: handleCancel,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
    },
  };
}
