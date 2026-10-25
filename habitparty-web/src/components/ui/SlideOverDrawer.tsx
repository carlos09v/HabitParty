"use client";

import { type ReactNode, useEffect } from "react";
import { cn } from "@/utils";

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  backdropAriaLabel?: string;
  containerClassName?: string;
  panelClassName?: string;
  children: ReactNode;
}

/**
 * Primitivo reutilizável de Gaveta Lateral Deslizante (Slide-over Drawer).
 * Centraliza o tratamento de tecla `Escape`, backdrop com `backdrop-blur-xs`
 * e animação de entrada pela direita.
 */
export function SlideOverDrawer({
  isOpen,
  onClose,
  ariaLabel,
  backdropAriaLabel = "Fechar gaveta lateral",
  containerClassName,
  panelClassName = "w-full sm:w-[420px]",
  children,
}: SlideOverDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={cn("fixed inset-0 z-50 overflow-hidden", containerClassName)}
    >
      <button
        type="button"
        aria-label={backdropAriaLabel}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 m-0 w-full h-full"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 max-w-full bg-surface border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out",
          panelClassName,
        )}
      >
        {children}
      </aside>
    </div>
  );
}
