"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useNativeModalDialog } from "@/hooks/useNativeModalDialog";
import { cn } from "@/utils/cn";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAnimationEnd?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerIcon?: React.ReactNode;
  headerIconClassName?: string;
  headerBadge?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  borderColor?: string;
  showCloseButton?: boolean;
  preventClose?: boolean;
  className?: string;
  containerClassName?: string;
  headerExtra?: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  onOpenAnimationEnd,
  title,
  description,
  headerIcon,
  headerIconClassName,
  headerBadge,
  children,
  maxWidth = "max-w-md",
  borderColor = "border-primary/40",
  showCloseButton = true,
  preventClose = false,
  className,
  containerClassName,
  headerExtra,
  ariaLabel,
  ariaLabelledBy,
}: BaseModalProps) {
  const tModal = useTranslations("ui.modal");
  const mounted = useIsClient();
  const titleId = useId();
  const descriptionId = useId();
  const onOpenAnimationEndRef = useRef(onOpenAnimationEnd);
  useEffect(() => {
    onOpenAnimationEndRef.current = onOpenAnimationEnd;
  }, [onOpenAnimationEnd]);

  // Abre/fecha o <dialog> nativo na top layer (focus trap, Esc, inert e restauração de foco nativos)
  // Montado via portal no document.body para nunca herdar `inert` do `#app-shell` (ex.: quando aberto via SlideOverDrawer)
  const { dialogRef, dialogEventHandlers } = useNativeModalDialog({
    isOpen: isOpen && mounted,
    onClose,
    preventClose,
  });

  // Em modo prefers-reduced-motion (.animate-in desativado via CSS), dispara o callback no 1º frame pós-abertura
  useEffect(() => {
    if (!isOpen || !mounted || !onOpenAnimationEndRef.current) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frameId = window.requestAnimationFrame(() => {
      onOpenAnimationEndRef.current?.();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : ariaLabelledBy}
      aria-describedby={description ? descriptionId : undefined}
      aria-label={
        !title && !ariaLabelledBy ? (ariaLabel ?? tModal("close")) : undefined
      }
      {...dialogEventHandlers}
      className={cn(
        "hp-dialog-modal fixed inset-0 w-screen h-dvh open:flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150",
        containerClassName,
      )}
    >
      <div
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) {
            onOpenAnimationEnd?.();
          }
        }}
        className={cn(
          "bg-popover border rounded-xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain custom-scrollbar",
          borderColor,
          maxWidth,
          className,
        )}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            disabled={preventClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-1 text-neutral-300 hover:text-gold-ink dark:hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-md disabled:opacity-50 cursor-pointer"
            aria-label={tModal("close")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {headerIcon ? (
          <div className="flex items-center gap-3 mb-4 pr-9">
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-ink dark:text-gold shadow-glow-gold-xs shrink-0 transition-colors",
                headerIconClassName,
              )}
            >
              {headerIcon}
            </div>
            {headerExtra}
            <div className="flex flex-col min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2 flex-wrap"
                >
                  <span>{title}</span>
                  {headerBadge}
                </h2>
              )}
              {description && (
                <div
                  id={descriptionId}
                  className="text-xs text-neutral-400 font-normal leading-relaxed mt-0.5"
                >
                  {description}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {(title || headerExtra) && (
              <div className="flex items-center gap-2 mb-4 pr-9">
                {headerExtra}
                {title && (
                  <h2
                    id={titleId}
                    className="text-label-g uppercase tracking-wider text-gold-ink dark:text-gold font-bold flex items-center gap-2 flex-wrap"
                  >
                    <span>{title}</span>
                    {headerBadge}
                  </h2>
                )}
              </div>
            )}

            {description && (
              <div
                id={descriptionId}
                className="text-body-s text-neutral-300 mb-5 leading-relaxed"
              >
                {description}
              </div>
            )}
          </>
        )}

        {children}
      </div>
    </dialog>,
    document.body,
  );
}
