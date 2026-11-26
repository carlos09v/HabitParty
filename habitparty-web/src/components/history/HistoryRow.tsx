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
import type { AppLocale } from "@/i18n/config";
import type {
  TransactionHistoryResponseDTO,
  TransactionMetadata,
} from "@/types/history";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { cn } from "@/utils/cn";
import { formatCoins } from "@/utils/economy";
import {
  resolveTransactionMetadata,
  type TransactionMetadataLabels,
} from "@/utils/historyUtils";

const MAX_VISIBLE_ROW_TAGS = 2;

interface HistoryRowProps {
  transaction: TransactionHistoryResponseDTO;
  showTimeOnly?: boolean;
  onSelectTransaction?: (tx: TransactionHistoryResponseDTO) => void;
  onRequestDelete?: (transaction: TransactionHistoryResponseDTO) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (transaction: TransactionHistoryResponseDTO) => void;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  userTimeZone?: string | null;
  metadataLabels?: TransactionMetadataLabels;
}

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
      <span className="text-tiny leading-tight text-neutral-400 font-normal inline-flex items-center gap-1 min-w-0">
        <FolderKanban size={10} className="shrink-0" aria-hidden="true" />
        <span className="sr-only">{columnLabel}</span>
        <span className="truncate">{columnName}</span>
      </span>
    );
  }
  if (priceSnapshot != null && priceSnapshot > 0) {
    return (
      <span className="text-tiny leading-tight text-neutral-400 font-normal inline-flex items-center gap-1">
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
    const extraFocusTags = tags.length - 1;
    return (
      <>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/30 text-amber-800 dark:text-gold text-label-g font-bold">
          <Timer size={11} className="shrink-0" aria-hidden="true" />
          {tags[0]}
        </span>
        {extraFocusTags > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface/80 dark:bg-white/10 border border-neutral-700/70 dark:border-white/15 text-neutral-300 text-tiny font-semibold">
            +{extraFocusTags}
          </span>
        )}
      </>
    );
  }

  const secondaryBadge = metadata.difficultyLabel || metadata.packageLabel;
  const visibleTags = tags.slice(0, MAX_VISIBLE_ROW_TAGS);
  const overflowTags = tags.slice(MAX_VISIBLE_ROW_TAGS);

  return (
    <>
      {secondaryBadge && (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-md border text-label-g font-semibold",
            metadata.secondaryBadgeClass ||
              "bg-surface dark:bg-white/10 border-neutral-600/40 dark:border-white/15 text-neutral-700 dark:text-neutral-200",
          )}
        >
          {secondaryBadge}
        </span>
      )}

      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface/80 dark:bg-white/5 border border-neutral-700/70 dark:border-white/10 text-neutral-300 text-tiny truncate max-w-[90px]"
        >
          #{tag}
        </span>
      ))}

      {overflowTags.length > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface/80 dark:bg-white/10 border border-neutral-700/70 dark:border-white/15 text-neutral-300 text-tiny font-semibold">
          +{overflowTags.length}
        </span>
      )}

      {showEmptyDash && !secondaryBadge && tags.length === 0 && (
        <span className="hidden md:inline text-neutral-500 text-xs">−</span>
      )}
    </>
  );
}

export const HistoryRow = memo(function HistoryRow({
  transaction,
  showTimeOnly = false,
  onSelectTransaction,
  onRequestDelete,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  dateFormat,
  timeFormat,
  userTimeZone,
  metadataLabels,
}: HistoryRowProps) {
  const t = useTranslations("history.row");
  const locale = useLocale() as AppLocale;
  const metadata = resolveTransactionMetadata(
    transaction,
    locale,
    dateFormat,
    timeFormat,
    userTimeZone,
    metadataLabels,
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

  const canSelect = Boolean(selectable && onToggleSelect && transaction.id);
  const rowName = transaction.name || t("defaultTransactionName");

  const subtext = (
    <TransactionSubtext
      columnName={transaction.columnName}
      columnLabel={t("columnLabel")}
      priceSnapshot={priceSnapshot}
      listPriceLabel={t("listPriceLabel")}
      locale={locale}
    />
  );

  const openDetails = () => onSelectTransaction?.(transaction);

  return (
    <article
      className={cn(
        "group relative w-full rounded-xl border border-l-4 transition-colors select-none text-left",
        "bg-card dark:bg-primary-dark/20 border-y-neutral-700 border-r-neutral-700 dark:border-y-primary/25 dark:border-r-primary/25 hover:border-y-primary/35 hover:border-r-primary/35 dark:hover:border-y-primary-light/40 dark:hover:border-r-primary-light/40 hover:bg-card-hover dark:hover:bg-primary-dark/35 shadow-2xs dark:shadow-none hover:shadow-xs",
        metadata.borderClass,
        isSelected &&
          "bg-gold/10 dark:bg-gold/8 border-y-gold/50 border-r-gold/50 dark:border-y-gold/45 dark:border-r-gold/45",
        "grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1.5 p-2.5",
        "md:grid md:items-center",
        canSelect ? HISTORY_GRID_COLS_SELECTABLE : HISTORY_GRID_COLS,
        "md:gap-3 md:px-3.5 md:py-2 md:text-xs",
      )}
    >
      {/* Checkbox + Identidade (Col 1 on mobile, Cols 1-2 on desktop) */}
      <div className="max-md:col-start-1 max-md:row-start-1 flex items-center gap-2 min-w-0 md:contents">
        {canSelect && (
          <div className="shrink-0 relative z-20 md:flex md:items-center md:justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(transaction)}
              aria-label={t("selectRowAria", { name: rowName })}
              className="checkbox-custom"
            />
          </div>
        )}

        <button
          type="button"
          onClick={openDetails}
          aria-label={t("rowTitle", { name: rowName })}
          className="flex items-center gap-2 min-w-0 text-left cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 after:content-[''] after:absolute after:inset-0 after:z-10"
        >
          <div className="w-7 h-7 md:w-6 md:h-6 rounded-lg md:rounded-md bg-surface border border-neutral-700/60 dark:border-white/10 flex items-center justify-center shrink-0 text-neutral-300 shadow-xs md:group-hover:border-primary/40 dark:md:group-hover:border-white/20 transition-colors">
            <IconComponent size={13} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-neutral-100 max-md:text-xs leading-tight truncate md:group-hover:text-primary dark:md:group-hover:text-gold transition-colors">
              {rowName}
            </span>
            {subtext}
          </div>
        </button>
      </div>

      {/* Tipo & Metadados (Row 2 col 1 on mobile, Cols 3-4 on desktop) */}
      <div className="max-md:col-start-1 max-md:row-start-2 flex items-center gap-1 flex-wrap text-xs md:contents pointer-events-none">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-md border font-semibold text-label-g leading-tight truncate",
              metadata.badgeClass,
            )}
          >
            {metadata.label}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap min-w-0">
          <TransactionMetaBadges
            metadata={metadata}
            tags={tags}
            showEmptyDash
          />
        </div>
      </div>

      {/* Ouro & XP (Col 2 row 1 on mobile, Cols 5-6 on desktop) */}
      <div className="max-md:col-start-2 max-md:row-start-1 flex flex-col items-end shrink-0 gap-0.5 md:contents pointer-events-none">
        <div
          className={cn(
            "md:flex md:items-center",
            gold === 0 && xp !== 0 && "max-md:hidden",
          )}
        >
          <CoinAmount amount={gold} size="sm" showZeroAsDash />
        </div>

        <div
          className={cn("md:flex md:items-center", xp === 0 && "max-md:hidden")}
        >
          <XpAmount amount={xp} size="sm" showZeroAsDash />
        </div>
      </div>

      {/* Horário & Exclusão (Col 2 row 2 on mobile, Cols 7-8 on desktop) */}
      <div className="max-md:col-start-2 max-md:row-start-2 flex items-center justify-end gap-1.5 md:contents">
        <span className="text-neutral-400 text-label-g md:text-xs font-medium md:text-right md:whitespace-nowrap tabular-nums pointer-events-none">
          {displayDateText}
        </span>

        <div className="relative z-20 md:flex md:items-center md:justify-end">
          {canDelete && (
            <button
              type="button"
              onClick={() => onRequestDelete?.(transaction)}
              title={t("deleteRecordTitle")}
              aria-label={t("deleteRecordAria", { name: rowName })}
              className="text-neutral-400 md:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 transition-[opacity,color,background-color] duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
