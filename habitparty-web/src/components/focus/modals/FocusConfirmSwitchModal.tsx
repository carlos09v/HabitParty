"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { BaseModal } from "@/components/ui/BaseModal";

export interface FocusConfirmSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  warningText: ReactNode;
  currentLabel?: string;
  currentValue: string;
  newLabel?: string;
  newValue: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
  onConfirm: () => void;
}

export function FocusConfirmSwitchModal({
  isOpen,
  onClose,
  title,
  description = "Já existe uma contagem de foco em andamento.",
  warningText,
  currentLabel = "Em andamento",
  currentValue,
  newLabel = "Novo foco",
  newValue,
  cancelButtonText = "Manter Atual",
  confirmButtonText = "Confirmar Troca",
  onConfirm,
}: FocusConfirmSwitchModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Aviso visual */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-neutral-300">
            {warningText}
          </div>
        </div>

        {/* Comparação visual: Atual -> Novo */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-primary/30">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g text-neutral-400 font-medium">
              {currentLabel}
            </span>
            <span
              className="text-body-s font-bold text-neutral-200 truncate"
              title={currentValue}
            >
              {currentValue}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
            <ArrowRight size={15} />
          </div>

          <div className="flex flex-col min-w-0 flex-1 text-right">
            <span className="text-label-g text-gold/90 font-medium">
              {newLabel}
            </span>
            <span
              className="text-body-s font-bold text-gold truncate"
              title={newValue}
            >
              {newValue}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
