"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { CoinAmount } from "@/components/ui/reward/CoinAmount";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import { TRANSACTION_CONTEXT_ROUTES } from "@/constants/history";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import { cn, formatCoins, formatDateTime } from "@/utils";
import { resolveTransactionMetadata } from "@/utils/historyUtils";

interface TransactionDetailPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionHistoryResponseDTO | null;
  anchorRect: DOMRect | null;
  /** Solicita exclusão (a confirmação é exibida pelo componente pai). */
  onRequestDelete?: (transaction: TransactionHistoryResponseDTO) => void;
  /** Suspende o fechamento por clique-fora/ESC (ex.: modal de confirmação aberto). */
  suspendDismiss?: boolean;
}

const POPOVER_OPTIONS = {
  preferredSide: "left" as const,
  popoverWidth: 380,
  popoverHeight: 460,
  margin: 16,
};

export function TransactionDetailPopover({
  isOpen,
  onClose,
  transaction,
  anchorRect,
  onRequestDelete,
  suspendDismiss = false,
}: TransactionDetailPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const position = useAnchoredPopoverPosition(
    isOpen,
    anchorRect,
    popoverRef,
    POPOVER_OPTIONS,
    mounted,
  );

  // Fecha no clique fora e ESC respeitando o modal de confirmação (hospedado no pai)
  useClickOutside(popoverRef, onClose, {
    enabled: isOpen && !suspendDismiss,
    onEscape: onClose,
  });

  if (!isOpen || !mounted || !transaction) return null;

  const metadata = resolveTransactionMetadata(transaction);
  const IconComponent = metadata.icon || HelpCircle;

  const gold = transaction.goldAmount ?? 0;
  const xp = transaction.xpAmount ?? 0;
  const priceSnapshot = transaction.priceSnapshot;
  const tags = transaction.tags || [];

  const handleCopyId = () => {
    if (!transaction.id) return;
    navigator.clipboard.writeText(transaction.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Atalho contextual para o módulo de origem (apenas se houver referência)
  const contextualRoute = transaction.referenceId
    ? TRANSACTION_CONTEXT_ROUTES[metadata.resolvedType]
    : undefined;

  // Mobile: centralizado via classes. Desktop (md+): ancorado via CSS vars.
  const anchorStyle = {
    "--pop-top": `${position.top}px`,
    "--pop-left": `${position.left}px`,
  } as CSSProperties;

  const popoverContent = (
    <>
      {/* Mobile Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover Card */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Detalhes da Transação"
        style={anchorStyle}
        className={cn(
          "fixed z-60 flex flex-col w-95 max-w-[calc(100vw-32px)] max-h-[calc(100vh-48px)] overflow-hidden",
          "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "md:top-(--pop-top) md:left-(--pop-left) md:translate-x-0 md:translate-y-0",
          "rounded-2xl border border-white/10 bg-card shadow-2xl text-neutral-100",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
      >
        {/* CABEÇALHO DO POPOVER */}
        <header className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-surface/50">
          <div className="flex items-start gap-3 min-w-0">
            {/* A cor do tipo de transação fica concentrada no ícone */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs",
                metadata.badgeClass,
              )}
            >
              <IconComponent size={20} />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded-md border text-tiny font-bold",
                    metadata.badgeClass,
                  )}
                >
                  {metadata.label}
                </span>

                {transaction.id && (
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copiar ID da Transação"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-tiny font-mono text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <Check size={10} className="text-emerald-400" />
                    ) : (
                      <Copy size={10} />
                    )}
                    <span>#{transaction.id.slice(0, 8)}</span>
                  </button>
                )}
              </div>

              <h3 className="text-sm font-bold text-neutral-100 leading-snug break-words">
                {transaction.name || "Transação"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </header>

        {/* CORPO DO POPOVER COM SCROLL SE NECESSÁRIO */}
        <div className="p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* PAINEL DE IMPACTO FINANCEIRO / XP */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface/70 border border-white/10">
            {/* Moedas */}
            <div className="flex flex-col gap-0.5">
              <span className="text-label-g font-semibold text-neutral-400 flex items-center gap-1">
                {gold > 0 ? (
                  <ArrowUpRight size={12} className="text-success-500" />
                ) : gold < 0 ? (
                  <ArrowDownLeft size={12} className="text-danger-500" />
                ) : null}
                Saldo de Moedas
              </span>
              <div className="flex items-center gap-1">
                <CoinAmount amount={gold} size="lg" />
              </div>
            </div>

            {/* Experiência (XP) */}
            <div className="flex flex-col gap-0.5">
              <span className="text-label-g font-semibold text-neutral-400">
                Experiência (XP)
              </span>
              <div className="flex items-center gap-1">
                <XpAmount amount={xp} size="lg" withIcon />
              </div>
            </div>
          </div>

          {/* DETALHES CONTEXTUAIS DA TAREFA / RECOMPENSA */}
          <div className="flex flex-col gap-2 text-xs text-neutral-300">
            {/* Preço original na loja se houver */}
            {priceSnapshot != null && priceSnapshot > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Preço tabela original:</span>
                <span className="font-semibold text-neutral-200 inline-flex items-center gap-1">
                  {formatCoins(priceSnapshot)} <CoinIcon size={12} />
                </span>
              </div>
            )}

            {/* Dificuldade ou Raridade */}
            {metadata.difficultyLabel && (
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Dificuldade da Tarefa:</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-100 font-semibold text-label-g">
                  {metadata.difficultyLabel}
                </span>
              </div>
            )}

            {metadata.packageLabel && (
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Raridade do Pacote:</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-100 font-semibold text-label-g">
                  {metadata.packageLabel}
                </span>
              </div>
            )}

            {/* Sessão de Foco: Duração */}
            {metadata.isFocus && tags.length > 0 && (
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">Duração da Sessão:</span>
                <span className="inline-flex items-center gap-1 font-bold text-gold bg-gold/15 px-1.5 py-0.5 rounded-md border border-gold/30 text-label-g">
                  <Timer size={12} />
                  {tags[0]}
                </span>
              </div>
            )}

            {/* Data e Hora Exatas */}
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-1">
                <Calendar size={12} /> Registrado em:
              </span>
              <span className="font-medium text-neutral-200 text-label-g">
                {formatDateTime(transaction.createdAt, {
                  includeSeconds: true,
                  includeYearFull: true,
                })}
              </span>
            </div>

            {/* Tags associadas */}
            {tags.length > 0 && (!metadata.isFocus || tags.length > 1) && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-neutral-400 flex items-center gap-1 text-label-g">
                  <Tag size={12} /> Tags vinculadas:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {(metadata.isFocus ? tags.slice(1) : tags).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 font-medium text-tiny"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Link contextual para o módulo de origem se existir */}
            {contextualRoute && (
              <div className="pt-1">
                <Link
                  href={contextualRoute.href}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-dark/40 border border-primary/40 hover:bg-primary-dark/70 hover:border-gold/40 text-neutral-300 hover:text-gold text-xs font-semibold transition-all group"
                  onClick={onClose}
                >
                  <span>{contextualRoute.label}</span>
                  <ExternalLink
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ DO POPOVER COM AÇÕES */}
        <footer className="p-3 border-t border-white/10 flex items-center justify-between gap-2 bg-surface/40 shrink-0">
          {onRequestDelete && transaction.id ? (
            <button
              type="button"
              onClick={() => onRequestDelete(transaction)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              Excluir
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-surface border border-white/15 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </footer>
      </div>
    </>
  );

  return createPortal(popoverContent, document.body);
}
