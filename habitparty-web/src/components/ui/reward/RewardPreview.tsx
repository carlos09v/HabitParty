"use client";

import { AlertTriangle, ChevronDown, Info, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { CoinAmount } from "@/components/ui/reward/CoinAmount";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import { useExperienceMode } from "@/hooks/useExperienceMode";
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
  /** Se verdadeiro, oculta completamente no modo Produtividade (padrão: true). */
  respectExperienceMode?: boolean;
}

/**
 * Componente unificado e reutilizável de prévia e cálculo de recompensas (Foco + Tarefas).
 * Inicia fechado (collapsed) por padrão para manter o layout limpo e sob demanda.
 * No perfil Produtividade, fica oculto para manter o layout focado na execução.
 */
export function RewardPreview({
  estimate,
  variant = "panel",
  label,
  className,
  isOpen: controlledIsOpen,
  onToggle,
  respectExperienceMode = true,
}: RewardPreviewProps) {
  const t = useTranslations("ui.rewardPreview");
  const resolvedLabel =
    label ??
    (variant === "inline" ? t("defaultInlineTitle") : t("defaultTitle"));
  const { isProductivity } = useExperienceMode();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isExpanded = isControlled ? controlledIsOpen : internalIsOpen;

  const contentId = useId();

  if (respectExperienceMode && isProductivity) {
    return null;
  }

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
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer select-none active:scale-95 shrink-0 outline-none",
            isExpanded
              ? "bg-amber-500/15 border-amber-500/50 text-amber-800 dark:bg-gold/15 dark:border-gold/50 dark:text-gold shadow-glow-gold-xs font-bold"
              : "bg-card dark:bg-surface border-neutral-700 dark:border-white/15 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/40 hover:bg-surface-hover",
            hasWarning &&
              !isExpanded &&
              "border-amber-500/50 text-amber-700 dark:border-amber-400/50 dark:text-amber-300",
            "focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <Sparkles
            size={13}
            className={cn(
              "shrink-0",
              isExpanded
                ? "text-amber-600 dark:text-gold"
                : hasWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-400",
            )}
          />
          <span>{resolvedLabel}</span>
          <ChevronDown
            size={13}
            className={cn(
              "transition-transform duration-200",
              isExpanded
                ? "rotate-180 text-amber-700 dark:text-gold"
                : "text-neutral-400",
            )}
          />
        </button>

        {isExpanded && (
          <div
            id={contentId}
            className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 flex-wrap"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/40 shadow-glow-gold-xs">
              <CoinAmount amount={estimate.gold} size="xs" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-magenta/15 border border-magenta/40">
              <XpAmount amount={estimate.xp} size="xs" />
            </div>

            {estimate.stageLabel && (
              <span className="text-[10px] font-bold text-primary dark:text-purple-300 bg-primary/10 dark:bg-purple-500/15 border border-primary/25 dark:border-purple-500/30 px-1.5 py-0.5 rounded">
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
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer select-none active:scale-98 outline-none",
            isExpanded
              ? "bg-amber-500/15 border-amber-500/50 text-amber-800 dark:bg-gold/15 dark:border-gold/50 dark:text-gold shadow-glow-gold-xs font-bold"
              : "bg-card dark:bg-surface/70 border-neutral-700 dark:border-white/15 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/40 hover:bg-surface",
            isZero && !isExpanded && "opacity-80 text-neutral-400",
            "focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <Sparkles
            size={14}
            className={cn(
              "shrink-0",
              isExpanded
                ? "text-amber-600 dark:text-gold"
                : hasWarning
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-neutral-400",
            )}
          />
          <span>{resolvedLabel}</span>
          {hasWarning && !isExpanded && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse"
              title={t("yieldWarningTitle")}
            />
          )}
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              isExpanded
                ? "rotate-180 text-amber-700 dark:text-gold"
                : "text-neutral-400",
            )}
          />
        </button>
      </div>

      {/* Painel Expansível Detalhado */}
      {isExpanded && (
        <div
          id={contentId}
          className={cn(
            "rounded-xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface p-3 flex flex-col gap-2.5",
            "animate-in fade-in zoom-in-95 duration-150 shadow-xs dark:shadow-sm",
          )}
        >
          {/* Cabeçalho com Total Estimado */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-700 dark:border-white/8 gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-400">
              {t("expectedYieldHeader")}
            </span>

            {isZero ? (
              <span className="text-xs text-neutral-400 italic">
                {estimate.zeroReason || t("zeroGainDefault")}
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <CoinAmount amount={estimate.gold} size="sm" withGlow />
                <span className="text-neutral-400 dark:text-neutral-600">
                  •
                </span>
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
                  className="flex items-center justify-between text-xs py-0.5"
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
                      ? "bg-amber-500/10 border-amber-500/35 text-amber-800 dark:text-amber-200"
                      : "bg-sky-500/10 dark:bg-blue-500/10 border-sky-500/30 dark:border-blue-500/30 text-sky-800 dark:text-blue-200",
                  )}
                >
                  {notice.tone === "warning" ? (
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
                    />
                  ) : (
                    <Info
                      size={14}
                      className="shrink-0 text-sky-600 dark:text-blue-400 mt-0.5"
                    />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <strong className="font-bold text-label-g">
                      {notice.title}
                    </strong>
                    <span className="text-xs opacity-90">{notice.message}</span>
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
