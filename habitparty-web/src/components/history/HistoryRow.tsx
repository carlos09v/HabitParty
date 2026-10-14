import { Trash2 } from "lucide-react";
import {
  DEFAULT_TRANSACTION_STYLE,
  DIFFICULTY_LABELS,
  PACKAGE_LABELS,
  TRANSACTION_TYPE_CONFIG,
} from "@/constants/history";
import { getRewardIcon } from "@/constants/reward";
import { getColumnIcon } from "@/constants/routine";
import type { HistoryRowProps } from "@/types/history";
import { cn, formatDateTime } from "@/utils";

export function HistoryRow({
  transaction,
  isCompact = false,
  onDelete,
}: HistoryRowProps) {
  const typeConfig =
    (transaction.transactionType &&
      TRANSACTION_TYPE_CONFIG[transaction.transactionType]) ||
    DEFAULT_TRANSACTION_STYLE;

  const resolvedCustomIcon = transaction.icon
    ? getRewardIcon(transaction.icon) || getColumnIcon(transaction.icon)
    : null;
  const IconComponent = resolvedCustomIcon || typeConfig.icon;
  const dateFormatted = formatDateTime(transaction.createdAt);

  const gold = transaction.goldAmount ?? 0;
  const xp = transaction.xpAmount ?? 0;
  const priceSnapshot = transaction.priceSnapshot;

  const difficultyOrPackage =
    (transaction.difficulty && DIFFICULTY_LABELS[transaction.difficulty]) ||
    (transaction.packageLevel &&
      transaction.packageLevel !== "NONE" &&
      PACKAGE_LABELS[transaction.packageLevel]) ||
    null;

  const tags = transaction.tags || [];

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_90px_80px_125px_36px] items-center rounded-xl border transition-all",
        isCompact ? "gap-2.5 px-3 py-2 text-xs" : "gap-3.5 px-4 py-3 text-sm",
        "bg-primary-dark/20 border-primary/25 hover:border-primary-light/40 hover:bg-primary-dark/35",
        typeConfig.borderClass,
        "border-l-4",
      )}
    >
      {/* 1. NOME / EVENTO COM ÍCONE E PREÇO ORIGINAL */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs">
          <IconComponent size={15} />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="font-bold text-neutral-100 truncate"
            title={transaction.name || "Evento"}
          >
            {transaction.name || "Transação"}
          </span>
          {priceSnapshot != null && priceSnapshot > 0 && (
            <span className="text-[10px] text-neutral-400 font-normal">
              Preço tabela: {priceSnapshot} H
            </span>
          )}
        </div>
      </div>

      {/* 2. TIPO DE EVENTO */}
      <div className="min-w-0">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border font-semibold truncate",
            isCompact ? "text-[11px]" : "text-xs",
            typeConfig.badgeClass,
          )}
        >
          {typeConfig.label}
        </span>
      </div>

      {/* 3. DIFICULDADE / NÍVEL + TAGS COMPLETAS */}
      <div className="flex items-center gap-1 flex-wrap min-w-0">
        {difficultyOrPackage && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-neutral-200 text-[11px] font-semibold">
            {difficultyOrPackage}
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

        {!difficultyOrPackage && tags.length === 0 && (
          <span className="text-neutral-500 text-xs">-</span>
        )}
      </div>

      {/* 4. MOEDAS (GOLD) */}
      <div className="flex items-center gap-1 font-bold whitespace-nowrap">
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

      {/* 5. EXPERIÊNCIA (XP) */}
      <div className="flex items-center gap-1 whitespace-nowrap">
        {xp > 0 ? (
          <span className="text-magenta font-bold flex items-center gap-1">
            +{xp} <span className="text-xs font-semibold">XP</span>
          </span>
        ) : (
          <span className="text-neutral-500 text-xs">-</span>
        )}
      </div>

      {/* 6. DATA E HORA */}
      <span className="text-right text-neutral-400 font-medium whitespace-nowrap text-xs">
        {dateFormatted}
      </span>

      {/* 7. AÇÃO DE EXCLUSÃO */}
      <div className="flex items-center justify-end">
        {onDelete &&
          transaction.id &&
          (() => {
            const txId = transaction.id;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(txId);
                }}
                title="Excluir registro do extrato"
                aria-label="Excluir registro do extrato"
                className="text-neutral-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            );
          })()}
      </div>
    </div>
  );
}
