"use client";

import { AlertTriangle, ChevronDown, Info, Sparkles } from "lucide-react";
import { useId, useState } from "react";
import { CoinAmount } from "@/components/ui/reward/CoinAmount";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import type { RewardEstimate } from "@/types/reward";
import { cn } from "@/utils";

export interface RewardPreviewProps {
  estimate: RewardEstimate;
  /** Variante visual: "panel" (padrão, expande painel estilizado) ou "inline" (compacto para rodapés de cards). */
  variant?: "panel" | "inline";
  /** Rótulo customizado do gatilho */
  label?: string;
  className?: string;
  /** Estado controlado opcional */
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Componente unificado e reutilizável de prévia e cálculo de recompensas (Foco + Tarefas).
 * Fica inicialmente recolhido e, ao clicar, expande detalhes, regras e bonificações.
 */
export function RewardPreview({
  estimate,
  variant = "panel",
  label = "Recompensa estimada",
  className,
  isOpen: controlledIsOpen,
  onToggle,
}: RewardPreviewProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isExpanded = isControlled ? controlledIsOpen : internalIsOpen;

  const contentId = useId();

  const handleToggle = () => {
    const next = !isExpanded;
    if (!isControlled) {
      setInternalIsOpen(next);
    }
    onToggle?.(next);
  };

  const hasWarning = estimate.notices?.some((n) => n.tone === "warning");
  const isZero = estimate.gold === 0 && estimate.xp === 0;

  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 shrink-0 outline-none",
            isExpanded
              ? "bg-gold/15 border-gold/50 text-gold shadow-glow-gold-xs font-bold"
              : "bg-surface border-white/15 text-neutral-300 hover:text-gold hover:border-gold/40 hover:bg-surface-hover",
            hasWarning && !isExpanded && "border-amber-400/50 text-amber-300",
            "focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <Sparkles
            size={13}
            className={cn(
              "shrink-0",
              isExpanded
                ? "text-gold"
                : hasWarning
                  ? "text-amber-400"
                  : "text-neutral-400",
            )}
          />
          <span>{label}</span>
          <ChevronDown
            size={13}
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-180 text-gold" : "text-neutral-400",
            )}
          />
        </button>

        {isExpanded && (
          <div
            id={contentId}
            className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 flex-wrap"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/40 shadow-glow-gold-xs">
              <CoinAmount amount={estimate.gold} size="xs" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-magenta/15 border border-magenta/40">
              <XpAmount amount={estimate.xp} size="xs" />
            </div>

            {estimate.stageLabel && (
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
                {estimate.stageLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      {/* Botão Gatilho Discreto e Elegante (inicialmente sem exibir valores) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none active:scale-98 outline-none",
            isExpanded
              ? "bg-gold/15 border-gold/50 text-gold shadow-glow-gold-xs font-bold"
              : "bg-surface/70 border-white/15 text-neutral-300 hover:text-gold hover:border-gold/40 hover:bg-surface",
            isZero && !isExpanded && "opacity-80 text-neutral-400",
            "focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <Sparkles
            size={14}
            className={cn(
              "shrink-0",
              isExpanded
                ? "text-gold"
                : hasWarning
                  ? "text-amber-400"
                  : "text-neutral-400",
            )}
          />
          <span>{label}</span>
          {hasWarning && !isExpanded && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
              title="Aviso sobre regras de rendimento"
            />
          )}
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-180 text-gold" : "text-neutral-400",
            )}
          />
        </button>
      </div>

      {/* Painel Expansível Detalhado */}
      {isExpanded && (
        <div
          id={contentId}
          className={cn(
            "rounded-xl border border-primary/30 bg-surface/85 backdrop-blur-md p-3 flex flex-col gap-2.5",
            "animate-in fade-in zoom-in-95 duration-150 shadow-sm",
          )}
        >
          {/* Cabeçalho com Total Estimado */}
          <div className="flex items-center justify-between pb-2 border-b border-white/8 gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-400">
              Rendimento Previsto
            </span>

            {isZero ? (
              <span className="text-xs text-neutral-400 italic">
                {estimate.zeroReason || "Sem ganho de XP ou Moedas"}
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <CoinAmount amount={estimate.gold} size="sm" withGlow />
                <span className="text-neutral-600">•</span>
                <XpAmount amount={estimate.xp} size="sm" withIcon />
              </div>
            )}
          </div>

          {/* Discriminação / Breakdown */}
          {estimate.breakdown && estimate.breakdown.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs text-neutral-300">
              {estimate.breakdown.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-caption py-0.5"
                >
                  <span className="text-neutral-400">{item.label}</span>
                  <span className="font-semibold text-neutral-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Avisos e Alertas (ex: Anti-exploit, Teto de 90m, Modo Hardcore) */}
          {estimate.notices && estimate.notices.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {estimate.notices.map((notice) => (
                <div
                  key={notice.title}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border text-xs leading-snug",
                    notice.tone === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-200",
                  )}
                >
                  {notice.tone === "warning" ? (
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-amber-400 mt-0.5"
                    />
                  ) : (
                    <Info size={14} className="shrink-0 text-blue-400 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <strong className="font-bold text-[11px]">
                      {notice.title}
                    </strong>
                    <span className="text-caption opacity-90">
                      {notice.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
