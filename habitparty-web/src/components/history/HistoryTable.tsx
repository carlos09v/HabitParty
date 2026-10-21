"use client";

import { History as HistoryIcon } from "lucide-react";
import { useState } from "react";
import { HISTORY_GRID_COLS } from "@/constants/history";
import type {
  HistoryTableProps,
  TransactionHistoryResponseDTO,
} from "@/types/history";
import { cn } from "@/utils";
import { HistoryRow } from "./HistoryRow";
import { TransactionDetailModal } from "./TransactionDetailModal";

export function HistoryTable({
  transactions,
  isCompact = false,
  onDelete,
  taskTypeMap,
}: HistoryTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionHistoryResponseDTO | null>(null);

  return (
    <section
      className="flex flex-col gap-2.5 w-full"
      aria-label="Extrato de transações"
    >
      {/* WRAPPER COM ROLAGEM HORIZONTAL PARA DESKTOP/TABLET QUANDO NECESSÁRIO */}
      <div className="w-full overflow-x-visible md:overflow-x-auto pb-1">
        <div className="min-w-0 md:min-w-[760px] flex flex-col gap-2">
          {/* CABEÇALHO DA TABELA (Apenas desktop/tablet) */}
          <div
            className={cn(
              "hidden md:grid items-center text-xs font-semibold text-neutral-400 select-none",
              HISTORY_GRID_COLS,
              isCompact ? "gap-2.5 px-3 py-1.5" : "gap-3.5 px-4 py-2",
            )}
            aria-hidden="true"
          >
            <span>Evento / Item</span>
            <span>Tipo de Evento</span>
            <span>Dificuldade / Tags</span>
            <span>Moedas</span>
            <span>XP</span>
            <span className="text-right">Data / Hora</span>
            <span className="sr-only">Ações</span>
          </div>

          {/* LISTA DE LINHAS OU ESTADO VAZIO */}
          {transactions.length === 0 ? (
            <div
              className={cn(
                "w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-primary/30 bg-primary-dark/20 backdrop-blur-xs",
                isCompact ? "py-10 px-4 gap-2.5" : "py-16 px-6 gap-3.5",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-gold shadow-sm">
                <HistoryIcon size={24} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-body-m font-bold text-neutral-100">
                  Nenhuma transação encontrada
                </h4>
                <p className="text-body-s text-neutral-400">
                  Não há movimentações de moedas ou XP para os filtros
                  selecionados.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 min-h-[350px]">
              {transactions.map((tx) => (
                <HistoryRow
                  key={tx.id || `${tx.createdAt}-${tx.name}`}
                  transaction={tx}
                  isCompact={isCompact}
                  onClick={() => setSelectedTransaction(tx)}
                  onDelete={onDelete}
                  taskTypeMap={taskTypeMap}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALHADO DA TRANSAÇÃO SELECIONADA */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onDelete={onDelete}
      />
    </section>
  );
}
