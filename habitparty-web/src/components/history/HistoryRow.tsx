"use client";

import { FolderKanban, Timer, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { CoinAmount } from "@/components/ui/reward/CoinAmount";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import {
  HISTORY_GRID_COLS,
  HISTORY_GRID_COLS_SELECTABLE,
} from "@/constants/history";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import type {
  TransactionHistoryResponseDTO,
  TransactionMetadata,
} from "@/types/history";
import { cn, formatCoins, resolveTransactionMetadata } from "@/utils";

interface HistoryRowProps {
  transaction: TransactionHistoryResponseDTO;
  isCompact?: boolean;
  /** Quando agrupado por dia, exibe apenas o horário (HH:mm) na coluna de data, mantendo a data completa no tooltip */
  showTimeOnly?: boolean;
  onClick?: (tx: TransactionHistoryResponseDTO, rect: DOMRect) => void;
  /** Solicita exclusão (a confirmação é exibida pelo componente pai). */
  onRequestDelete?: (transaction: TransactionHistoryResponseDTO) => void;
  /** Habilita a coluna de seleção (checkbox) para exclusão em lote. */
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (transaction: TransactionHistoryResponseDTO) => void;
}

/**
 * Subtexto da 1ª coluna. A duração do Foco não é repetida aqui (já aparece na coluna "Detalhes / Tags").
 */
function TransactionSubtext({
  columnName,
  columnLabel,
  priceSnapshot,
  listPriceLabel,
  locale,
}: {
  columnName?: string | null;
  columnLabel: string;
  priceSnapshot?: number | null;
  listPriceLabel: string;
  locale: AppLocale;
}) {
  if (columnName) {
    return (
      <span
        className="text-tiny text-neutral-400 font-normal inline-flex items-center gap-1 min-w-0"
        title={`${columnLabel} ${columnName}`}
      >
        <FolderKanban size={10} className="shrink-0" aria-hidden="true" />
        <span className="sr-only">{columnLabel}</span>
        <span className="truncate">{columnName}</span>
      </span>
    );
  }
  if (priceSnapshot != null && priceSnapshot > 0) {
    return (
      <span className="text-tiny text-neutral-400 font-normal inline-flex items-center gap-1">
        {listPriceLabel} {formatCoins(priceSnapshot, { locale })}{" "}
        <CoinIcon size={10} />
      </span>
    );
  }
  return null;
}

function TransactionMetaBadges({
  metadata,
  tags,
  showEmptyDash = false,
}: {
  metadata: TransactionMetadata;
  tags: string[];
  showEmptyDash?: boolean;
}) {
  if (metadata.isFocus && tags.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold text-label-g font-bold">
        <Timer size={11} className="shrink-0" />
        {tags[0]}
      </span>
    );
  }

  const secondaryBadge = metadata.difficultyLabel || metadata.packageLabel;

  return (
    <>
      {secondaryBadge && (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-md border text-label-g font-semibold",
            metadata.secondaryBadgeClass ||
              "bg-white/10 border-white/15 text-neutral-200",
          )}
        >
          {secondaryBadge}
        </span>
      )}

      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 text-tiny truncate max-w-[90px]"
          title={tag}
        >
          #{tag}
        </span>
      ))}

      {showEmptyDash && !secondaryBadge && tags.length === 0 && (
        <span className="text-neutral-500 text-xs">−</span>
      )}
    </>
  );
}

export const HistoryRow = memo(function HistoryRow({
  transaction,
  isCompact = false,
  showTimeOnly = false,
  onClick,
  onRequestDelete,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: HistoryRowProps) {
  const t = useTranslations("history.row");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const metadata = resolveTransactionMetadata(
    transaction,
    locale,
    dateFormat,
    timeFormat,
  );
  const IconComponent = metadata.icon;

  const gold = transaction.goldAmount ?? 0;
  const xp = transaction.xpAmount ?? 0;
  const priceSnapshot = transaction.priceSnapshot;
  const tags = transaction.tags || [];
  const canDelete = Boolean(onRequestDelete && transaction.id);
  const displayDateText = showTimeOnly
    ? metadata.formattedTime
    : metadata.formattedDate;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete?.(transaction);
  };

  const canSelect = Boolean(selectable && onToggleSelect && transaction.id);
  const rowName = transaction.name || t("defaultTransactionName");
  const selectCheckbox = canSelect ? (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggleSelect?.(transaction)}
      // Evita abrir o popover da linha ao marcar/desmarcar
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={t("selectRowAria", { name: rowName })}
      className="checkbox-custom"
    />
  ) : null;

  const subtext = (
    <TransactionSubtext
      columnName={transaction.columnName}
      columnLabel={t("columnLabel")}
      priceSnapshot={priceSnapshot}
      listPriceLabel={t("listPriceLabel")}
      locale={locale}
    />
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: container row contains nested interactive delete button
    <div
      role="button"
      tabIndex={0}
      onClick={(e) =>
        onClick?.(transaction, e.currentTarget.getBoundingClientRect())
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(transaction, e.currentTarget.getBoundingClientRect());
        }
      }}
      className={cn(
        "group w-full rounded-xl border border-l-4 transition-colors cursor-pointer select-none text-left",
        "bg-card dark:bg-primary-dark/20 border-y-neutral-700 border-r-neutral-700 dark:border-y-primary/25 dark:border-r-primary/25 hover:border-y-primary/35 hover:border-r-primary/35 dark:hover:border-y-primary-light/40 dark:hover:border-r-primary-light/40 hover:bg-card-hover dark:hover:bg-primary-dark/35 shadow-2xs dark:shadow-none hover:shadow-xs",
        metadata.borderClass,
        isSelected &&
          "bg-gold/10 dark:bg-gold/8 border-y-gold/50 border-r-gold/50 dark:border-y-gold/45 dark:border-r-gold/45",
        // Mobile Layout: flex column
        "flex flex-col gap-2 p-3",
        // Desktop Layout (md+): Grid perfeitamente alinhado com o cabeçalho
        "md:grid md:items-center",
        canSelect ? HISTORY_GRID_COLS_SELECTABLE : HISTORY_GRID_COLS,
        isCompact
          ? "md:gap-2.5 md:px-3 md:py-2 md:text-xs"
          : "md:gap-3.5 md:px-4 md:py-3 md:text-sm",
      )}
      title={t("rowTitle")}
    >
      {/* ========================================================= */}
      {/* 1. VISUALIZAÇÃO MOBILE (< md)                              */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col gap-2 w-full">
        {/* Linha Superior: Ícone + Título (Esq) | Moedas & XP (Dir) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectCheckbox}
            <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs">
              <IconComponent size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-neutral-100 text-sm truncate">
                {transaction.name || t("defaultTransactionName")}
              </span>
              {subtext}
            </div>
          </div>

          {/* Moedas e XP */}
          <div className="flex flex-col items-end shrink-0 gap-0.5">
            {gold !== 0 || xp === 0 ? (
              <CoinAmount amount={gold} size="sm" showZeroAsDash={xp === 0} />
            ) : null}
            {xp !== 0 && <XpAmount amount={xp} size="xs" />}
          </div>
        </div>

        {/* Linha Central: Badges e Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pl-10 text-xs">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-md border font-semibold text-label-g truncate",
              metadata.badgeClass,
            )}
          >
            {metadata.label}
          </span>

          <TransactionMetaBadges metadata={metadata} tags={tags} />
        </div>

        {/* Linha Inferior: Data/Hora e Ação de Excluir */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 pl-10">
          <span
            className="text-neutral-400 text-label-g font-medium"
            title={metadata.formattedDate}
          >
            {displayDateText}
          </span>

          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title={t("deleteRecordTitle")}
              aria-label={t("deleteRecordAria")}
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
      {/* Col 0: Seleção para exclusão em lote */}
      {canSelect && (
        <div className="hidden md:flex items-center justify-center">
          {selectCheckbox}
        </div>
      )}

      {/* Col 1: Nome / Evento */}
      <div className="hidden md:flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs group-hover:border-white/20 transition-colors">
          <IconComponent size={15} />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="font-bold text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors"
            title={transaction.name || t("defaultEventTitle")}
          >
            {transaction.name || t("defaultTransactionName")}
          </span>
          {subtext}
        </div>
      </div>

      {/* Col 2: Tipo de Evento */}
      <div className="hidden md:block min-w-0">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md border font-semibold truncate",
            isCompact ? "text-label-g" : "text-xs",
            metadata.badgeClass,
          )}
        >
          {metadata.label}
        </span>
      </div>

      {/* Col 3: Detalhes / Tags */}
      <div className="hidden md:flex items-center gap-1 flex-wrap min-w-0">
        <TransactionMetaBadges metadata={metadata} tags={tags} showEmptyDash />
      </div>

      {/* Col 4: Moedas (padrão "−" quando 0) */}
      <div className="hidden md:flex items-center">
        <CoinAmount
          amount={gold}
          size={isCompact ? "xs" : "sm"}
          showZeroAsDash
        />
      </div>

      {/* Col 5: XP (padrão "−" quando 0) */}
      <div className="hidden md:flex items-center">
        <XpAmount
          amount={xp}
          size={isCompact ? "xs" : "sm"}
          showSign={false}
          showZeroAsDash
        />
      </div>

      {/* Col 6: Data e Hora */}
      <span
        className="hidden md:block text-right text-neutral-400 font-medium whitespace-nowrap text-xs"
        title={metadata.formattedDate}
      >
        {displayDateText}
      </span>

      {/* Col 7: Ação de Excluir (discreto no desktop, visível no hover/focus) */}
      <div className="hidden md:flex items-center justify-end">
        {canDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            title={t("deleteRecordTitle")}
            aria-label={t("deleteRecordAria")}
            className="text-neutral-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-[opacity,color,background-color] duration-150 cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
});
