"use client";

import { Timer, Trash2 } from "lucide-react";
import { HISTORY_GRID_COLS } from "@/constants/history";
import type { HistoryRowProps } from "@/types/history";
import { cn } from "@/utils";
import { resolveTransactionMetadata } from "@/utils/historyUtils";

export function HistoryRow({
  transaction,
  isCompact = false,
  onClick,
  onDelete,
  taskTypeMap,
}: HistoryRowProps) {
  const metadata = resolveTransactionMetadata(transaction, taskTypeMap);
  const IconComponent = metadata.icon;

  const gold = transaction.goldAmount ?? 0;
  const xp = transaction.xpAmount ?? 0;
  const priceSnapshot = transaction.priceSnapshot;
  const tags = transaction.tags || [];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transaction.id && onDelete) {
      onDelete(transaction.id);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: container row contains nested interactive delete button
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group w-full rounded-xl border transition-all cursor-pointer select-none text-left",
        "bg-primary-dark/20 border-primary/25 hover:border-primary-light/40 hover:bg-primary-dark/35 hover:shadow-xs",
        metadata.borderClass,
        "border-l-4",
        // Mobile Layout: flex column
        "flex flex-col gap-2 p-3",
        // Desktop Layout (md+): Grid perfeitamente alinhado com o cabeçalho
        "md:grid md:items-center",
        HISTORY_GRID_COLS,
        isCompact
          ? "md:gap-2.5 md:px-3 md:py-2 md:text-xs"
          : "md:gap-3.5 md:px-4 md:py-3 md:text-sm",
      )}
      title="Clique para ver os detalhes da transação"
    >
      {/* ========================================================= */}
      {/* 1. VISUALIZAÇÃO MOBILE (< md)                              */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col gap-2 w-full">
        {/* Linha Superior: Ícone + Título (Esq) | Moedas & XP (Dir) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs">
              <IconComponent size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-neutral-100 text-sm truncate">
                {transaction.name || "Transação"}
              </span>
              {metadata.isFocus && tags.length > 0 ? (
                <span className="text-[11px] text-neutral-400 font-normal flex items-center gap-1">
                  Duração:{" "}
                  <span className="text-gold font-semibold">{tags[0]}</span>
                </span>
              ) : priceSnapshot != null && priceSnapshot > 0 ? (
                <span className="text-[10px] text-neutral-400 font-normal">
                  Preço tabela: {priceSnapshot} H
                </span>
              ) : null}
            </div>
          </div>

          {/* Moedas e XP */}
          <div className="flex flex-col items-end shrink-0 gap-0.5">
            {gold > 0 ? (
              <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                +{gold}
                <span className="text-[9px] w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-black">
                  H
                </span>
              </span>
            ) : gold < 0 ? (
              <span className="text-red-400 font-bold text-sm flex items-center gap-1">
                {gold}
                <span className="text-[9px] w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-black">
                  H
                </span>
              </span>
            ) : (
              <span className="text-neutral-400 text-xs font-normal">0 H</span>
            )}

            {xp > 0 && (
              <span className="text-magenta font-bold text-xs flex items-center gap-0.5">
                +{xp} <span className="text-[10px] font-semibold">XP</span>
              </span>
            )}
          </div>
        </div>

        {/* Linha Central: Badges e Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pl-10 text-xs">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-md border font-semibold text-[10px] truncate",
              metadata.badgeClass,
            )}
          >
            {metadata.label}
          </span>

          {metadata.isFocus && tags.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold">
              <Timer size={10} className="shrink-0" />
              {tags[0]}
            </span>
          ) : (
            <>
              {(metadata.difficultyLabel || metadata.packageLabel) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-200 text-[10px] font-semibold">
                  {metadata.difficultyLabel || metadata.packageLabel}
                </span>
              )}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 text-[9px] truncate max-w-[80px]"
                >
                  #{tag}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Linha Inferior: Data/Hora e Ação de Excluir */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 pl-10">
          <span className="text-neutral-400 text-[11px] font-medium">
            {metadata.formattedDate}
          </span>

          {onDelete && transaction.id && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title="Excluir registro do extrato"
              aria-label="Excluir registro do extrato"
              className="text-neutral-400 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. VISUALIZAÇÃO DESKTOP: GRID DE 7 COLUNAS (md+)           */}
      {/* ========================================================= */}
      {/* Col 1: Nome / Evento */}
      <div className="hidden md:flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs group-hover:border-white/20 transition-colors">
          <IconComponent size={15} />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="font-bold text-neutral-100 truncate group-hover:text-gold transition-colors"
            title={transaction.name || "Evento"}
          >
            {transaction.name || "Transação"}
          </span>
          {metadata.isFocus && tags.length > 0 ? (
            <span className="text-[11px] text-neutral-400 font-normal flex items-center gap-1">
              Duração:{" "}
              <span className="text-gold font-semibold">{tags[0]}</span>
            </span>
          ) : priceSnapshot != null && priceSnapshot > 0 ? (
            <span className="text-[10px] text-neutral-400 font-normal">
              Preço tabela: {priceSnapshot} H
            </span>
          ) : null}
        </div>
      </div>

      {/* Col 2: Tipo de Evento */}
      <div className="hidden md:block min-w-0">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border font-semibold truncate",
            isCompact ? "text-[11px]" : "text-xs",
            metadata.badgeClass,
          )}
        >
          {metadata.label}
        </span>
      </div>

      {/* Col 3: Dificuldade / Tags */}
      <div className="hidden md:flex items-center gap-1 flex-wrap min-w-0">
        {metadata.isFocus && tags.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold">
            <Timer size={11} className="shrink-0" />
            {tags[0]}
          </span>
        ) : (
          <>
            {(metadata.difficultyLabel || metadata.packageLabel) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-200 text-[11px] font-semibold">
                {metadata.difficultyLabel || metadata.packageLabel}
              </span>
            )}

            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 text-[10px] truncate max-w-[90px]"
                title={tag}
              >
                #{tag}
              </span>
            ))}

            {!metadata.difficultyLabel &&
              !metadata.packageLabel &&
              tags.length === 0 && (
                <span className="text-neutral-500 text-xs">-</span>
              )}
          </>
        )}
      </div>

      {/* Col 4: Moedas */}
      <div className="hidden md:flex items-center gap-1 font-bold whitespace-nowrap">
        {gold > 0 ? (
          <span className="text-emerald-400 flex items-center gap-1">
            +{gold}
            <span className="text-[10px] w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-bold">
              H
            </span>
          </span>
        ) : gold < 0 ? (
          <span className="text-red-400 flex items-center gap-1">
            {gold}
            <span className="text-[10px] w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 text-neutral-900 inline-flex items-center justify-center font-bold">
              H
            </span>
          </span>
        ) : (
          <span className="text-neutral-400 font-normal">0 H</span>
        )}
      </div>

      {/* Col 5: XP */}
      <div className="hidden md:flex items-center gap-1 whitespace-nowrap">
        {xp > 0 ? (
          <span className="text-magenta font-bold flex items-center gap-1">
            +{xp} <span className="text-xs font-semibold">XP</span>
          </span>
        ) : (
          <span className="text-neutral-500 text-xs">-</span>
        )}
      </div>

      {/* Col 6: Data e Hora */}
      <span className="hidden md:block text-right text-neutral-400 font-medium whitespace-nowrap text-xs">
        {metadata.formattedDate}
      </span>

      {/* Col 7: Ação de Excluir */}
      <div className="hidden md:flex items-center justify-end">
        {onDelete && transaction.id && (
          <button
            type="button"
            onClick={handleDeleteClick}
            title="Excluir registro do extrato"
            aria-label="Excluir registro do extrato"
            className="text-neutral-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
