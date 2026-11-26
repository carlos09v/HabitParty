"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useNativeModalDialog } from "@/hooks/useNativeModalDialog";
import { cn } from "@/utils/cn";

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Mantido por compatibilidade com chamadores existentes; o backdrop nativo de `<dialog>` dispensa botão extra. */
  backdropAriaLabel?: string;
  /** Quando `true`, exibe como Bottom Sheet no mobile (`< md`) e Slide-over à direita no desktop (`md+`). */
  responsiveBottomSheet?: boolean;
  /** Suspende fechamento via Escape/backdrop (ex.: modal de confirmação aberto por cima). */
  preventClose?: boolean;
  containerClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}

/**
 * Primitivo unificado de Gaveta Lateral Deslizante (Slide-over Drawer / Bottom Sheet mobile)
 * construído sobre `<dialog>` nativo (`showModal()`):
 * - Top Layer nativo, `inert` automático no fundo, focus trap, tecla `Escape` e restauração de foco.
 * - Compatível com `open:flex` (sem sobrescrever o estado fechado de `<dialog>`) e `::backdrop` com `overflow: hidden`.
 * - Respeita `prefers-reduced-motion`.
 */
export function SlideOverDrawer({
  isOpen,
  onClose,
  ariaLabel,
  ariaLabelledBy,
  responsiveBottomSheet = false,
  preventClose = false,
  containerClassName,
  panelClassName = "w-full sm:w-[420px]",
  children,
}: SlideOverDrawerProps) {
  const mounted = useIsClient();

  const { dialogRef, dialogEventHandlers } = useNativeModalDialog({
    isOpen: isOpen && mounted,
    onClose,
    preventClose,
  });

  if (!isOpen || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={ariaLabelledBy}
      aria-label={!ariaLabelledBy ? ariaLabel : undefined}
      {...dialogEventHandlers}
      className={cn(
        "hp-dialog-modal fixed inset-0 w-screen h-dvh p-0 animate-in fade-in duration-150 motion-reduce:animate-none",
        responsiveBottomSheet
          ? "open:flex items-end md:items-stretch md:justify-end"
          : "open:flex items-stretch justify-end",
        containerClassName,
      )}
    >
      <aside
        className={cn(
          responsiveBottomSheet
            ? "relative flex flex-col w-full md:w-[420px] max-w-full max-h-[86dvh] md:max-h-none md:h-full overflow-hidden rounded-t-2xl md:rounded-none md:rounded-l-2xl border-t md:border-t-0 md:border-l border-neutral-700 dark:border-white/10 bg-popover shadow-2xl text-neutral-100 animate-in slide-in-from-bottom md:slide-in-from-right duration-200 motion-reduce:animate-none outline-none"
            : "relative flex flex-col max-w-full h-full bg-card dark:bg-surface border-l border-neutral-700 dark:border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 ease-out motion-reduce:animate-none outline-none",
          panelClassName,
        )}
      >
        {children}
      </aside>
    </dialog>,
    document.body,
  );
}
