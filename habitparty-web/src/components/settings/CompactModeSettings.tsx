"use client";

import { Check, Sparkles } from "lucide-react";
import { useCompactMode } from "@/hooks/useCompactMode";
import { cn } from "@/utils";

export function CompactModeSettings() {
  const { isCompact, setCompactMode } = useCompactMode();

  return (
    <div className="flex flex-col gap-5">
      <div
        className={cn(
          "rounded-xl border flex items-center gap-3 w-fit",
          isCompact ? "p-3" : "p-4",
          isCompact
            ? "bg-gold/10 border-gold/30 text-gold"
            : "bg-white/5 border-white/10 text-neutral-300",
        )}
      >
        <Sparkles size={20} className="shrink-0" />
        <div className="text-sm">
          <span className="font-bold">Status atual: </span>
          {isCompact
            ? "O Modo Compacto está ativo (recomendado para maior produtividade e densidade de informação)."
            : "O Modo Confortável está ativo (espaçamento expandido padrão)."}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <button
          type="button"
          onClick={() => setCompactMode(true)}
          className={cn(
            "rounded-xl border text-left flex items-start justify-between gap-4 transition-all cursor-pointer h-full",
            isCompact ? "p-3" : "p-4",
            isCompact
              ? "bg-primary-dark/60 border-gold shadow-[0_0_15px_rgba(237,229,57,0.15)] ring-1 ring-gold"
              : "bg-surface/40 border-white/10 hover:border-white/20",
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-m font-bold text-neutral-100">
                Modo Compacto
              </span>
            </div>
            <p className="text-body-s text-neutral-300 leading-relaxed">
              Cards, calendários e listas menores. Otimiza o espaço de tela para
              visualização simultânea de mais tarefas e itens de recompensa.
              Recomendado para maior produtividade.
            </p>
          </div>
          {isCompact && (
            <div className="w-6 h-6 rounded-full bg-gold text-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={14} className="stroke-3" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCompactMode(false)}
          className={cn(
            "rounded-xl border text-left flex items-start justify-between gap-4 transition-all cursor-pointer h-full",
            isCompact ? "p-3" : "p-4",
            !isCompact
              ? "bg-primary-dark/60 border-gold shadow-[0_0_15px_rgba(237,229,57,0.15)] ring-1 ring-gold"
              : "bg-surface/40 border-white/10 hover:border-white/20",
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-m font-bold text-neutral-100">
                Modo Confortável
              </span>
              <span className="text-tiny font-bold px-2 py-0.5 rounded bg-gold/20 text-gold uppercase tracking-wider">
                Padrão
              </span>
            </div>
            <p className="text-body-s text-neutral-300 leading-relaxed">
              Paddings mais generosos e tipografia padrão. Ideal para telas
              grandes ou para quem prefere espaçamentos mais relaxados e
              elementos maiores.
            </p>
          </div>
          {!isCompact && (
            <div className="w-6 h-6 rounded-full bg-gold text-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={14} className="stroke-3" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
