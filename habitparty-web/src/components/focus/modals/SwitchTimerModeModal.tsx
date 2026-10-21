"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
import type { FocusRecordType } from "@/types/focus";

interface SwitchTimerModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: FocusRecordType;
  newMode: FocusRecordType;
  onConfirm: () => void;
}

export function SwitchTimerModeModal({
  isOpen,
  onClose,
  currentMode,
  newMode,
  onConfirm,
}: SwitchTimerModeModalProps) {
  const currentModeLabel = currentMode === "POMO" ? "Pomodoro" : "Cronômetro";
  const newModeLabel = newMode === "POMO" ? "Pomodoro" : "Cronômetro";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Trocar Modo de Foco"
      description="Já existe uma contagem de foco em andamento."
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Aviso visual */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-neutral-300">
            <p>
              Você possui uma contagem ativa no modo{" "}
              <strong className="text-amber-300">{currentModeLabel}</strong>. Se
              você alternar para{" "}
              <strong className="text-gold">{newModeLabel}</strong> agora, o
              tempo não salvo desta sessão será zerado.
            </p>
          </div>
        </div>

        {/* Comparação visual: Atual -> Novo */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-primary/30">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g text-neutral-400 font-medium">
              Modo Atual
            </span>
            <span
              className="text-body-s font-bold text-neutral-200 truncate"
              title={currentModeLabel}
            >
              {currentModeLabel}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
            <ArrowRight size={15} />
          </div>

          <div className="flex flex-col min-w-0 flex-1 text-right">
            <span className="text-label-g text-gold/90 font-medium">
              Novo Modo
            </span>
            <span
              className="text-body-s font-bold text-gold truncate"
              title={newModeLabel}
            >
              {newModeLabel}
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
            Manter Atual
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer"
          >
            Trocar e Zerar Tempo
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
