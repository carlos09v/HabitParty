"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { BaseModal } from "./BaseModal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const borderColor = isDanger
    ? "border-red-500/30"
    : isWarning
      ? "border-amber-500/30"
      : "border-primary/30";

  const headerExtra = (
    <AlertTriangle
      size={20}
      className={
        isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-gold"
      }
    />
  );

  const confirmBtnClasses = isDanger
    ? "bg-red-500 hover:bg-red-600 text-white shadow-xs"
    : isWarning
      ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-glow-gold-xs"
      : "bg-gold hover:bg-gold-hover text-neutral-900 shadow-glow-gold-xs";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      borderColor={borderColor}
      preventClose={isLoading}
      headerExtra={headerExtra}
      title={
        <span
          className={
            isDanger
              ? "text-red-400"
              : isWarning
                ? "text-amber-400"
                : "text-neutral-100"
          }
        >
          {title}
        </span>
      }
    >
      <div className="flex flex-col gap-4 mt-1">
        <div className="text-body-s text-neutral-300 leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${confirmBtnClasses}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
