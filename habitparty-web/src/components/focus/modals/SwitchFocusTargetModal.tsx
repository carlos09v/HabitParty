"use client";

import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";

interface SwitchFocusTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  newTargetName: string;
  isCurrentInventory?: boolean;
  isNewInventory?: boolean;
  onTransfer: () => void;
  onSaveAndStartNew: () => Promise<void> | void;
  onDiscardAndStartNew: () => void;
}

export function SwitchFocusTargetModal({
  isOpen,
  onClose,
  currentName,
  newTargetName,
  isCurrentInventory = false,
  isNewInventory = false,
  onTransfer,
  onSaveAndStartNew,
  onDiscardAndStartNew,
}: SwitchFocusTargetModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);

  if (!isOpen) return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeDisplay =
    minutes === 0
      ? `${seconds}s`
      : seconds === 0
        ? `${minutes}m`
        : `${minutes}m ${seconds}s`;

  // Transferência direta só é permitida entre atividades normais
  const canTransfer = !isCurrentInventory && !isNewInventory;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAndStartNew();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransfer = () => {
    onTransfer();
    onClose();
  };

  const handleDiscard = () => {
    onDiscardAndStartNew();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isSaving}
      maxWidth="max-w-lg"
      title="Trocar Sessão de Foco"
      description="Você possui uma contagem com tempo em andamento."
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Banner de Comparação Visual */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-primary/30">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g text-neutral-400 font-medium">
              Sessão Atual
            </span>
            <span
              className="text-body-s font-bold text-neutral-200 truncate"
              title={currentName}
            >
              {currentName}
            </span>
            <span className="flex items-center gap-1 text-label-g font-semibold text-gold mt-0.5">
              <Timer size={12} />
              {timeDisplay} decorridos
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
            <ArrowRight size={15} />
          </div>

          <div className="flex flex-col min-w-0 flex-1 text-right">
            <span className="text-label-g text-gold/90 font-medium">
              Novo Alvo
            </span>
            <span
              className="text-body-s font-bold text-gold truncate"
              title={newTargetName}
            >
              {newTargetName}
            </span>
            <span className="text-label-g text-neutral-400 mt-0.5">
              {isNewInventory ? "Item da Mochila" : "Atividade"}
            </span>
          </div>
        </div>

        {/* Escolhas de Ação (Opções 1, 2 e 3) */}
        <div className="flex flex-col gap-2.5">
          {/* Opção 1: Transferir Tempo Atual (Recomendado entre Atividades) */}
          {canTransfer ? (
            <button
              type="button"
              onClick={handleTransfer}
              disabled={isSaving}
              className="w-full text-left p-3.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 hover:border-gold transition-all flex items-start gap-3 group cursor-pointer shadow-glow-gold-xs disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-gold/20 text-gold flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ArrowRightLeft size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-s font-bold text-neutral-100">
                    Transferir tempo atual
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-tiny font-bold bg-gold text-neutral-900">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  Mantém os{" "}
                  <strong className="text-gold font-semibold">
                    {timeDisplay}
                  </strong>{" "}
                  decorridos e continua o cronômetro para{" "}
                  <strong className="text-neutral-200 font-semibold">
                    {newTargetName}
                  </strong>{" "}
                  sem reiniciar a contagem.
                </p>
              </div>
            </button>
          ) : (
            <div className="w-full text-left p-3 rounded-xl border border-primary/20 bg-surface/40 opacity-60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRightLeft size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-neutral-300">
                  Transferência direta indisponível
                </span>
                <p className="text-label-g text-neutral-400 mt-0.5">
                  Não é possível transferir saldo de tempo entre itens da
                  mochila e atividades comuns.
                </p>
              </div>
            </div>
          )}

          {/* Opção 2: Salvar Atual e Iniciar Nova */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full text-left p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-body-s font-bold text-neutral-100">
                Salvar atual e iniciar nova
              </span>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Registra os{" "}
                <strong className="text-emerald-400 font-semibold">
                  {timeDisplay}
                </strong>{" "}
                na atividade atual (
                <span className="text-neutral-300">{currentName}</span>) e
                inicia o foco em{" "}
                <strong className="text-neutral-200 font-semibold">
                  {newTargetName}
                </strong>{" "}
                do zero.
              </p>
            </div>
          </button>

          {/* Opção 3: Descartar Atual e Começar Nova */}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSaving}
            className="w-full text-left p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all flex items-start gap-3 group cursor-pointer disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RotateCcw size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-body-s font-bold text-neutral-100">
                Descartar atual e começar nova
              </span>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Descarta o tempo não salvo desta sessão e inicia o cronômetro
                para{" "}
                <strong className="text-neutral-200 font-semibold">
                  {newTargetName}
                </strong>{" "}
                do zero.
              </p>
            </div>
          </button>
        </div>

        {/* Rodapé com botão de Cancelar / Manter Atual */}
        <div className="flex items-center justify-end pt-3 border-t border-primary/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer",
              isSaving && "opacity-50 cursor-not-allowed",
            )}
          >
            Manter Sessão Atual
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
