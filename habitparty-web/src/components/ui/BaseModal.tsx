"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  borderColor?: string;
  showCloseButton?: boolean;
  preventClose?: boolean;
  className?: string;
  headerExtra?: React.ReactNode;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-md",
  borderColor = "border-primary/40",
  showCloseButton = true,
  preventClose = false,
  className,
  headerExtra,
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Control body scroll lock and escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, preventClose, onClose]);

  if (!isOpen || !mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !preventClose) {
          onClose();
        }
      }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          "bg-popover border rounded-xl w-full p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar",
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
            className="absolute top-4 right-4 text-neutral-300 hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 rounded-md disabled:opacity-50 cursor-pointer"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        )}

        {(title || headerExtra) && (
          <div className="flex items-center gap-2 mb-4">
            {headerExtra}
            {title && (
              <h2 className="text-label-l uppercase tracking-wider text-gold-pressed font-bold">
                {title}
              </h2>
            )}
          </div>
        )}

        {description && (
          <div className="text-body-s text-neutral-300 mb-5 leading-relaxed">
            {description}
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body,
  );
}
