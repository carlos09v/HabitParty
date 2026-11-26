"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  FolderKanban,
  HelpCircle,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { CoinAmount } from "@/components/ui/reward/CoinAmount";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { TRANSACTION_CONTEXT_ROUTE_MAP } from "@/constants/history";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/date";
import { formatCoins } from "@/utils/economy";
import {
  resolveTransactionMetadata,
  type TransactionMetadataLabels,
} from "@/utils/historyUtils";

interface TransactionDetailPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionHistoryResponseDTO | null;
  /** Solicita exclusão (a confirmação é exibida pelo componente pai). */
  onRequestDelete?: (transaction: TransactionHistoryResponseDTO) => void;
  /** Suspende o fechamento por clique-fora/ESC (ex.: modal de confirmação aberto por cima). */
  suspendDismiss?: boolean;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  userTimeZone?: string | null;
  metadataLabels?: TransactionMetadataLabels;
}

/**
 * Painel de detalhes da transação em formato Slide-over Drawer (desktop) / Bottom Sheet (mobile),
 * usando `<dialog>` nativo para focus trap, top-layer, tecla Escape e restauração de foco.
 */
export function TransactionDetailPopover({
  isOpen,
  onClose,
  transaction,
  onRequestDelete,
  suspendDismiss = false,
  dateFormat: propDateFormat,
  timeFormat: propTimeFormat,
  userTimeZone: propUserTimeZone,
  metadataLabels,
}: TransactionDetailPopoverProps) {
  const t = useTranslations("history.detailPopover");
  const tUtils = useTranslations("history.utils");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { dateFormat: hookDateFormat } = useDateFormat();
  const { timeFormat: hookTimeFormat } = useTimeFormat();
  const storeUserTimeZone = useUserStore((s) => s.user?.timezone);
  const dateFormat = propDateFormat ?? hookDateFormat;
  const timeFormat = propTimeFormat ?? hookTimeFormat;
  const userTimeZone = propUserTimeZone ?? storeUserTimeZone;

  const titleId = useId();
  const {
    copied: copiedId,
    copy: copyId,
    reset: resetCopiedId,
  } = useCopyFeedback();

  // Reseta estado visual de "copiado" ao trocar a transação exibida ou fechar
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reseta copiedId ao mudar de registro ou fechar
  useEffect(() => {
    resetCopiedId();
  }, [transaction?.id, isOpen, resetCopiedId]);

  if (!isOpen || !transaction) return null;

  const metadata = resolveTransactionMetadata(
    transaction,
    locale,
    dateFormat,
    timeFormat,
    userTimeZone,
    metadataLabels,
  );
  const IconComponent = metadata.icon || HelpCircle;

  const gold = transaction.goldAmount ?? 0;
  const xp = transaction.xpAmount ?? 0;
  const priceSnapshot = transaction.priceSnapshot;
  const tags = transaction.tags || [];
  const description = transaction.description?.trim();

  const handleCopyId = () => {
    void copyId(transaction.id, {
      success: t("copiedToast"),
      error: t("copyFailedToast"),
    });
  };

  const routeConfig = transaction.referenceId
    ? TRANSACTION_CONTEXT_ROUTE_MAP[metadata.resolvedType]
    : undefined;
  const contextualRouteLabel = routeConfig
    ? routeConfig.routeKey === "inventory"
      ? isGamified
        ? tUtils("contextRoutes.inventoryGamified")
        : tUtils("contextRoutes.inventoryProductivity")
      : routeConfig.routeKey === "rewards"
        ? isGamified
          ? tUtils("contextRoutes.rewardsGamified")
          : tUtils("contextRoutes.rewardsProductivity")
        : tUtils(`contextRoutes.${routeConfig.routeKey}`)
    : undefined;

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      responsiveBottomSheet
      preventClose={suspendDismiss}
      panelClassName=""
    >
      {/* Indicador de alça mobile */}
      <div
        aria-hidden="true"
        className="md:hidden flex justify-center pt-2 pb-1 bg-surface/50"
      >
        <span className="w-10 h-1 rounded-full bg-neutral-600/60" />
      </div>

      {/* CABEÇALHO DO DRAWER */}
      <header className="p-4 sm:p-5 border-b border-neutral-700 dark:border-white/10 flex items-start justify-between gap-3 bg-surface/50">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs",
              metadata.badgeClass,
            )}
          >
            <IconComponent size={20} aria-hidden="true" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
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
                  title={t("copyIdTitle")}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-tiny font-mono text-neutral-400 bg-surface dark:bg-white/5 hover:bg-surface-hover dark:hover:bg-white/10 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {copiedId ? (
                    <Check
                      size={10}
                      aria-hidden="true"
                      className="text-emerald-700 dark:text-emerald-400"
                    />
                  ) : (
                    <Copy size={10} aria-hidden="true" />
                  )}
                  <span>#{transaction.id.slice(0, 8)}</span>
                </button>
              )}
            </div>

            <h2
              id={titleId}
              className="text-base font-bold text-neutral-100 leading-snug break-words"
            >
              {transaction.name || t("defaultTransactionName")}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeAria")}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      {/* CORPO COM SCROLL */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
        {/* PAINEL DE IMPACTO FINANCEIRO / XP */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface/70 border border-neutral-700 dark:border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-label-g font-semibold text-neutral-400 flex items-center gap-1">
              {gold > 0 ? (
                <ArrowUpRight
                  size={12}
                  aria-hidden="true"
                  className="text-success-500"
                />
              ) : gold < 0 ? (
                <ArrowDownLeft
                  size={12}
                  aria-hidden="true"
                  className="text-danger-500"
                />
              ) : null}
              {isGamified
                ? t("coinChangeLabel")
                : t("coinChangeLabelProductivity")}
            </span>
            <div className="flex items-center gap-1">
              <CoinAmount amount={gold} size="lg" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-label-g font-semibold text-neutral-400">
              {isGamified ? t("xpLabel") : t("xpLabelProductivity")}
            </span>
            <div className="flex items-center gap-1">
              <XpAmount amount={xp} size="lg" withIcon />
            </div>
          </div>
        </div>

        {/* DESCRIÇÃO COMPLETA SEM TRUNCAMENTO */}
        {description && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface/50 border border-neutral-700/70 dark:bg-white/[0.03] dark:border-white/10">
            <FileText
              size={14}
              className="text-neutral-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-tiny font-semibold text-neutral-400 uppercase tracking-wider">
                {t("descriptionLabel")}
              </span>
              <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                {description}
              </p>
            </div>
          </div>
        )}

        {/* DETALHES CONTEXTUAIS */}
        <dl className="flex flex-col gap-2 text-xs text-neutral-300">
          {priceSnapshot != null && priceSnapshot > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/70 dark:border-white/5">
              <dt className="text-neutral-400">
                {t("originalListPriceLabel")}
              </dt>
              <dd className="font-semibold text-neutral-200 inline-flex items-center gap-1 tabular-nums">
                {formatCoins(priceSnapshot, { locale })} <CoinIcon size={12} />
              </dd>
            </div>
          )}

          {transaction.columnName && (
            <div className="flex items-center justify-between gap-3 py-1.5 border-b border-neutral-700/70 dark:border-white/5">
              <dt className="text-neutral-400 shrink-0">{t("columnLabel")}</dt>
              <dd
                className="inline-flex items-center gap-1 min-w-0 px-2 py-0.5 rounded-md border font-semibold text-label-g bg-surface border-neutral-700 dark:bg-white/10 dark:border-white/15 text-neutral-100"
                title={transaction.columnName}
              >
                <FolderKanban
                  size={12}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">{transaction.columnName}</span>
              </dd>
            </div>
          )}

          {metadata.difficultyLabel && (
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/70 dark:border-white/5">
              <dt className="text-neutral-400">
                {isGamified
                  ? t("taskDifficultyLabel")
                  : t("taskDifficultyLabelProductivity")}
              </dt>
              <dd
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md border font-semibold text-label-g",
                  metadata.secondaryBadgeClass ||
                    "bg-surface border-neutral-700 dark:bg-white/10 dark:border-white/15 text-neutral-100",
                )}
              >
                {metadata.difficultyLabel}
              </dd>
            </div>
          )}

          {metadata.packageLabel && (
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/70 dark:border-white/5">
              <dt className="text-neutral-400">{t("packageRarityLabel")}</dt>
              <dd
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md border font-semibold text-label-g",
                  metadata.secondaryBadgeClass ||
                    "bg-surface border-neutral-700 dark:bg-white/10 dark:border-white/15 text-neutral-100",
                )}
              >
                {metadata.packageLabel}
              </dd>
            </div>
          )}

          {metadata.isFocus && tags.length > 0 && (
            <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/70 dark:border-white/5">
              <dt className="text-neutral-400">{t("sessionDurationLabel")}</dt>
              <dd className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-gold bg-amber-500/15 dark:bg-gold/15 border-amber-500/35 dark:border-gold/30 px-2 py-0.5 rounded-md border text-label-g">
                <Timer size={12} aria-hidden="true" />
                {tags[0]}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-neutral-700/70 dark:border-white/5">
            <dt className="text-neutral-400 flex items-center gap-1.5">
              <Calendar size={12} aria-hidden="true" /> {t("recordedAtLabel")}
            </dt>
            <dd className="font-medium text-neutral-200 text-label-g tabular-nums">
              {formatDateTime(transaction.createdAt, {
                includeSeconds: true,
                includeYearFull: true,
                locale,
                dateFormat,
                timeFormat,
                timeZone: userTimeZone,
              })}
            </dd>
          </div>
        </dl>

        {tags.length > 0 && (!metadata.isFocus || tags.length > 1) && (
          <div className="flex flex-col gap-1.5">
            <span className="text-neutral-400 flex items-center gap-1 text-label-g font-semibold">
              <Tag size={12} aria-hidden="true" /> {t("linkedTagsLabel")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(metadata.isFocus ? tags.slice(1) : tags).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-neutral-200 font-medium text-tiny"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {routeConfig && contextualRouteLabel && (
          <div className="pt-1">
            <Link
              href={routeConfig.href}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface dark:bg-primary-dark/40 border border-neutral-700 dark:border-primary/40 hover:bg-surface-hover dark:hover:bg-primary-dark/70 hover:border-amber-500/40 dark:hover:border-gold/40 text-neutral-200 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-gold text-xs font-semibold transition-colors group"
              onClick={onClose}
            >
              <span>{contextualRouteLabel}</span>
              <ExternalLink
                size={12}
                aria-hidden="true"
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        )}
      </div>

      {/* RODAPÉ */}
      <footer className="p-3.5 sm:p-4 border-t border-neutral-700 dark:border-white/10 flex items-center justify-between gap-2 bg-surface/40 shrink-0">
        {onRequestDelete && transaction.id ? (
          <button
            type="button"
            onClick={() => onRequestDelete(transaction)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
          >
            <Trash2 size={13} aria-hidden="true" />
            {t("deleteButton")}
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-surface border border-neutral-700 dark:border-white/15 text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover dark:hover:text-white dark:hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
        >
          {t("closeButton")}
        </button>
      </footer>
    </SlideOverDrawer>
  );
}
