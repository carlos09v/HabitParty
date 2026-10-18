"use client";

import {
  Calendar,
  Check,
  Copy,
  HelpCircle,
  Sparkles,
  Tag,
  Timer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import type { TransactionDetailModalProps } from "@/types/history";
import { cn, formatDateTime } from "@/utils";
import { resolveTransactionMetadata } from "@/utils/historyUtils";

/**
 * Modal flutuante de inspeção detalhada da transação.
 * Renderiza o contexto completo com design gamificado, metadados de auditoria e ações.
 */
export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onDelete,
}: TransactionDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

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

  const handleConfirmDelete = async () => {
    if (!transaction.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-lg"
        borderColor={metadata.borderClass.replace("border-l-", "border-")}
        className="p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5">
          {/* CABEÇALHO DO CARD COM ÍCONE E BADGE */}
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm",
                "bg-surface text-neutral-200 border-white/10",
                metadata.borderClass.replace("border-l-", "border-"),
              )}
            >
              <IconComponent size={24} />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold",
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
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-neutral-200 transition-colors cursor-pointer"
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

              <h3 className="text-lg font-bold text-neutral-100 leading-snug break-words">
                {transaction.name || "Transação"}
              </h3>
            </div>
          </div>

          {/* PAINEL DE IMPACTO FINANCEIRO / XP */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface/70 border border-white/10">
            {/* Moedas */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-400">
                Saldo de Moedas
              </span>
              <div className="flex items-center gap-1.5">
                {gold > 0 ? (
                  <span className="text-emerald-400 font-extrabold text-base sm:text-lg flex items-center gap-1">
                    +{gold}
                    <span className="text-[10px] w-4 h-4 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-black">
                      H
                    </span>
                  </span>
                ) : gold < 0 ? (
                  <span className="text-red-400 font-extrabold text-base sm:text-lg flex items-center gap-1">
                    {gold}
                    <span className="text-[10px] w-4 h-4 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-black">
                      H
                    </span>
                  </span>
                ) : (
                  <span className="text-neutral-300 font-bold text-base">
                    0 H
                  </span>
                )}
              </div>
            </div>

            {/* Experiência XP */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-400">
                Experiência (XP)
              </span>
              <div className="flex items-center gap-1.5">
                {xp > 0 ? (
                  <span className="text-magenta font-extrabold text-base sm:text-lg flex items-center gap-1">
                    <Sparkles size={16} />+{xp} XP
                  </span>
                ) : xp < 0 ? (
                  <span className="text-red-400 font-extrabold text-base sm:text-lg">
                    {xp} XP
                  </span>
                ) : (
                  <span className="text-neutral-400 text-sm font-medium">
                    Sem ganho de XP
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DETALHES CONTEXTUAIS DA TAREFA / RECOMPENSA */}
          <div className="flex flex-col gap-2.5 text-xs text-neutral-300">
            {/* Preço original na loja se houver */}
            {priceSnapshot != null && priceSnapshot > 0 && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Preço original tabela:</span>
                <span className="font-semibold text-neutral-200">
                  {priceSnapshot} Moedas
                </span>
              </div>
            )}

            {/* Dificuldade ou Raridade */}
            {metadata.difficultyLabel && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Dificuldade da Tarefa:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-100 font-semibold">
                  {metadata.difficultyLabel}
                </span>
              </div>
            )}

            {metadata.packageLabel && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Raridade do Pacote:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-100 font-semibold">
                  {metadata.packageLabel}
                </span>
              </div>
            )}

            {/* Sessão de Foco: Duração */}
            {metadata.isFocus && tags.length > 0 && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Duração da Sessão:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-md border border-gold/30">
                  <Timer size={13} />
                  {tags[0]}
                </span>
              </div>
            )}

            {/* Data e Hora Exatas */}
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-neutral-400 flex items-center gap-1">
                <Calendar size={13} /> Registrado em:
              </span>
              <span className="font-medium text-neutral-200">
                {formatDateTime(transaction.createdAt, {
                  includeSeconds: true,
                  includeYearFull: true,
                })}
              </span>
            </div>

            {/* Tags associadas */}
            {tags.length > 0 && (!metadata.isFocus || tags.length > 1) && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Tag size={13} /> Tags vinculadas:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(metadata.isFocus ? tags.slice(1) : tags).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 font-medium text-[11px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ DE AÇÕES */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            {onDelete && transaction.id ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                Excluir Registro
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-surface border border-white/15 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </BaseModal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro de Transação"
        description="Tem certeza que deseja remover permanentemente este registro do seu extrato? Esta ação não pode ser desfeita."
        confirmText={isDeleting ? "Excluindo..." : "Excluir Registro"}
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
