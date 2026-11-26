"use client";

import {
  Calendar,
  History as HistoryIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteTransactionAction,
  deleteTransactionsBatchAction,
  restoreTransactionsBatchAction,
} from "@/actions/historyActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import {
  HISTORY_GRID_COLS,
  HISTORY_GRID_COLS_SELECTABLE,
} from "@/constants/history";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type {
  HistorySortOption,
  TransactionDayGroup,
  TransactionHistoryResponseDTO,
} from "@/types/history";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { cn } from "@/utils/cn";
import {
  groupTransactionsByDay,
  isChronologicalHistorySort,
  type TransactionDayLabels,
  type TransactionMetadataLabels,
} from "@/utils/historyUtils";
import { HistoryBulkActionBar } from "./HistoryBulkActionBar";
import { HistoryRow } from "./HistoryRow";
import { TransactionDetailPopover } from "./TransactionDetailPopover";

interface HistoryTableProps {
  transactions: TransactionHistoryResponseDTO[];
  initialGroups?: TransactionDayGroup[];
  initialDateFormat?: DateFormat;
  initialTimeFormat?: TimeFormat;
  initialTimeZone?: string | null;
  sort?: HistorySortOption;
  hasActiveFilters?: boolean;
  /** Habilita seleção múltipla com "Selecionar tudo" e exclusão em lote. */
  selectable?: boolean;
}

export function HistoryTable({
  transactions,
  initialGroups,
  initialDateFormat,
  initialTimeFormat,
  initialTimeZone,
  sort = "NEWEST",
  hasActiveFilters = false,
  selectable = false,
}: HistoryTableProps) {
  const t = useTranslations("history.table");
  const tUtils = useTranslations("history.utils");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useUIStore((s) => s.hydrated);
  const storeUserTimeZone = useUserStore((s) => s.user?.timezone);
  const { dateFormat: storeDateFormat } = useDateFormat();
  const { timeFormat: storeTimeFormat } = useTimeFormat();

  const dateFormat = hydrated
    ? storeDateFormat
    : (initialDateFormat ?? storeDateFormat);
  const timeFormat = hydrated
    ? storeTimeFormat
    : (initialTimeFormat ?? storeTimeFormat);
  const userTimeZone = hydrated
    ? (storeUserTimeZone ?? initialTimeZone)
    : initialTimeZone !== undefined
      ? initialTimeZone
      : storeUserTimeZone;

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionHistoryResponseDTO | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<TransactionHistoryResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== Seleção múltipla =====
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const desktopSelectAllRef = useRef<HTMLInputElement>(null);
  const mobileSelectAllRef = useRef<HTMLInputElement>(null);

  const selectableIds = useMemo(
    () =>
      transactions.map((tx) => tx.id).filter((id): id is string => Boolean(id)),
    [transactions],
  );

  // Interseção derivada diretamente no render: evita 1 frame com seleção obsoleta ou `isAllSelected` falso ao trocar página/filtro
  const visibleSelectedIds = useMemo(() => {
    if (selectedIds.size === 0) return selectedIds;
    const visible = new Set(selectableIds);
    const filtered = new Set<string>();
    for (const id of selectedIds) {
      if (visible.has(id)) filtered.add(id);
    }
    return filtered;
  }, [selectedIds, selectableIds]);

  const selectedCount = visibleSelectedIds.size;
  const isAllSelected =
    selectableIds.length > 0 && selectedCount === selectableIds.length;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;
  const showSelection = selectable && selectableIds.length > 0;

  useEffect(() => {
    if (desktopSelectAllRef.current) {
      desktopSelectAllRef.current.indeterminate = isPartiallySelected;
    }
    if (mobileSelectAllRef.current) {
      mobileSelectAllRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  const handleToggleSelect = useCallback(
    (tx: TransactionHistoryResponseDTO) => {
      const id = tx.id;
      if (!id) return;
      setSelectedIds((prev) => {
        const visible = new Set(selectableIds);
        const next = new Set([...prev].filter((item) => visible.has(item)));
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [selectableIds],
  );

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? new Set() : new Set(selectableIds));
  }, [isAllSelected, selectableIds]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const showUndoRestoreToast = useCallback(
    (message: string, idsToRestore: string[]) => {
      let restoring = false;
      toast.success(message, {
        duration: 7000,
        action: {
          label: t("toasts.undoAction"),
          onClick: () => {
            if (restoring) return;
            restoring = true;
            void (async () => {
              try {
                const restoreRes =
                  await restoreTransactionsBatchAction(idsToRestore);
                if (!restoreRes.success) {
                  restoring = false;
                  toast.error(restoreRes.error || t("toasts.restoreError"));
                  return;
                }
                const restoredCount =
                  restoreRes.data?.affectedCount ?? idsToRestore.length;
                toast.success(
                  t("toasts.restoreSuccess", { count: restoredCount }),
                );
              } catch {
                restoring = false;
                toast.error(t("toasts.restoreError"));
              }
            })();
          },
        },
      });
    },
    [t],
  );

  const handleConfirmBulkDelete = async () => {
    const ids = [...visibleSelectedIds];
    if (ids.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await deleteTransactionsBatchAction(ids);
      if (!res.success) {
        toast.error(res.error || t("bulk.deleteError"));
        return;
      }
      const affectedCount = res.data?.affectedCount ?? ids.length;
      showUndoRestoreToast(
        t("bulk.deleteSuccess", { count: affectedCount }),
        ids,
      );
      if (
        selectedTransaction?.id &&
        visibleSelectedIds.has(selectedTransaction.id)
      ) {
        setSelectedTransaction(null);
      }
      setSelectedIds(new Set());
      setIsBulkModalOpen(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const dayLabels = useMemo<TransactionDayLabels>(
    () => ({
      unknownDate: tUtils("unknownDate"),
      today: tUtils("today"),
      yesterday: tUtils("yesterday"),
    }),
    [tUtils],
  );

  const metadataLabels = useMemo<TransactionMetadataLabels>(
    () => ({
      defaultTransactionLabel: tUtils("defaultTransactionLabel"),
      getTransactionTypeLabel: (resolvedType: string) =>
        tUtils.has(
          `transactionTypes.${resolvedType}` as Parameters<
            typeof tUtils.has
          >[0],
        )
          ? tUtils(
              `transactionTypes.${resolvedType}` as Parameters<
                typeof tUtils
              >[0],
            )
          : tUtils("defaultTransactionLabel"),
      getDifficultyLabel: (difficulty: string) =>
        tUtils.has(
          `difficulties.${difficulty}` as Parameters<typeof tUtils.has>[0],
        )
          ? tUtils(`difficulties.${difficulty}` as Parameters<typeof tUtils>[0])
          : difficulty,
      getPackageLabel: (packageLevel: string) =>
        tUtils.has(
          `packages.${packageLevel}` as Parameters<typeof tUtils.has>[0],
        )
          ? tUtils(`packages.${packageLevel}` as Parameters<typeof tUtils>[0])
          : packageLevel,
    }),
    [tUtils],
  );

  const isChronological = isChronologicalHistorySort(sort);

  // `timeFormat` não afeta agrupamento por dia (somente `dateFormat` e `userTimeZone`)
  const canReuseInitialGroups =
    isChronological &&
    Boolean(initialGroups) &&
    (!hydrated ||
      ((initialDateFormat === undefined || dateFormat === initialDateFormat) &&
        (initialTimeZone === undefined ||
          (userTimeZone ?? null) === (initialTimeZone ?? null))));

  const groupedTransactions = useMemo(() => {
    if (!isChronological) {
      return [];
    }
    if (canReuseInitialGroups && initialGroups) {
      return initialGroups;
    }
    return groupTransactionsByDay(
      transactions,
      new Date(),
      locale,
      dateFormat,
      userTimeZone,
      dayLabels,
    );
  }, [
    isChronological,
    canReuseInitialGroups,
    initialGroups,
    transactions,
    locale,
    dateFormat,
    userTimeZone,
    dayLabels,
  ]);

  const handleSelectTransaction = useCallback(
    (tx: TransactionHistoryResponseDTO) => {
      setSelectedTransaction(tx);
    },
    [],
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  const handleRequestDelete = useCallback(
    (tx: TransactionHistoryResponseDTO) => setPendingDelete(tx),
    [],
  );

  const handleConfirmDelete = async () => {
    if (!pendingDelete?.id) return;
    const deletedId = pendingDelete.id;
    setIsDeleting(true);
    try {
      const res = await deleteTransactionAction(deletedId);
      if (!res.success) {
        toast.error(res.error || t("toasts.deleteError"));
        return;
      }
      showUndoRestoreToast(t("toasts.deleteSuccess"), [deletedId]);

      setSelectedIds((prev) => {
        if (!prev.has(deletedId)) return prev;
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      if (selectedTransaction?.id === deletedId) {
        handleCloseDrawer();
      }
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      className="flex flex-col gap-2 w-full"
      aria-label={t("sectionAria")}
    >
      {/* CONTROLE COMPACTO DE SELEÇÃO MOBILE (no desktop fica integrado ao cabeçalho da tabela) */}
      {showSelection && (
        <div className="flex md:hidden items-center justify-between px-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 cursor-pointer select-none">
            <input
              ref={mobileSelectAllRef}
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              aria-label={t("headers.selectAllAria")}
              className="checkbox-custom"
            />
            <span>{t("bulk.selectAll")}</span>
          </label>
        </div>
      )}

      {/* WRAPPER DA TABELA */}
      <div className="w-full overflow-x-visible md:overflow-x-auto pb-0.5">
        <div className="min-w-0 md:min-w-[700px] flex flex-col gap-1.5">
          {/* CABEÇALHO DA TABELA (Desktop/tablet, com checkbox Selecionar tudo integrado) */}
          {transactions.length > 0 && (
            <div
              className={cn(
                "hidden md:grid items-center border-l-4 border-r border-transparent text-xs font-semibold text-neutral-400 select-none gap-3 px-3.5 py-1.5",
                showSelection
                  ? HISTORY_GRID_COLS_SELECTABLE
                  : HISTORY_GRID_COLS,
              )}
            >
              {showSelection && (
                <div className="flex items-center justify-center">
                  <input
                    ref={desktopSelectAllRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label={t("headers.selectAllAria")}
                    className="checkbox-custom"
                  />
                </div>
              )}
              <span>{t("headers.eventItem")}</span>
              <span>{t("headers.eventType")}</span>
              <span>
                {isGamified
                  ? t("headers.difficultyTags")
                  : t("headers.difficultyTagsProductivity")}
              </span>
              <span>
                {isGamified
                  ? t("headers.coins")
                  : t("headers.coinsProductivity")}
              </span>
              <span>
                {isGamified ? t("headers.xp") : t("headers.xpProductivity")}
              </span>
              <span className="text-right">{t("headers.time")}</span>
              <span className="sr-only">{t("headers.actions")}</span>
            </div>
          )}

          {/* LISTA AGRUPADA POR DIA OU ESTADO VAZIO DIFERENCIADO */}
          {transactions.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-primary/30 bg-card/50 dark:bg-primary-dark/20 py-14 px-6 gap-3.5">
              <div className="w-12 h-12 rounded-full bg-primary/15 dark:bg-primary/20 border border-primary/35 flex items-center justify-center text-amber-800 dark:text-gold shadow-xs">
                {hasActiveFilters ? (
                  <HistoryIcon size={24} aria-hidden="true" />
                ) : (
                  <Sparkles size={24} aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h2 className="text-body-m font-bold text-neutral-100">
                  {hasActiveFilters ? t("emptyFilteredTitle") : t("emptyTitle")}
                </h2>
                <p className="text-body-s text-neutral-400">
                  {hasActiveFilters
                    ? isGamified
                      ? t("emptyFilteredDescription")
                      : t("emptyFilteredDescriptionProductivity")
                    : isGamified
                      ? t("emptyDescription")
                      : t("emptyDescriptionProductivity")}
                </p>
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-neutral-600 dark:border-white/15 text-xs font-bold text-neutral-100 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  {t("emptyFilteredClear")}
                </button>
              ) : (
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold hover:bg-gold-hover text-on-gold text-xs font-bold shadow-glow-gold-xs transition-colors"
                >
                  {t("emptyCtaTasks")}
                </Link>
              )}
            </div>
          ) : !isChronological ? (
            <div className="flex flex-col gap-1.5">
              {transactions.map((tx) => (
                <HistoryRow
                  key={tx.id || `${tx.createdAt}-${tx.name}`}
                  transaction={tx}
                  showTimeOnly={false}
                  onSelectTransaction={handleSelectTransaction}
                  onRequestDelete={handleRequestDelete}
                  selectable={showSelection}
                  isSelected={Boolean(tx.id && visibleSelectedIds.has(tx.id))}
                  onToggleSelect={handleToggleSelect}
                  dateFormat={dateFormat}
                  timeFormat={timeFormat}
                  userTimeZone={userTimeZone}
                  metadataLabels={metadataLabels}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedTransactions.map((group, groupIdx) => (
                <div
                  key={group.dateKey}
                  className={cn(
                    "flex flex-col gap-1.5",
                    groupIdx > 0 && "deferred-history-group",
                  )}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface/80 border border-neutral-700/80 dark:border-primary/30 text-label-g font-bold text-neutral-200 shadow-2xs">
                      <Calendar
                        size={11}
                        aria-hidden="true"
                        className="text-amber-800 dark:text-gold shrink-0"
                      />
                      <span>{group.label}</span>
                    </span>
                    <div className="h-px flex-1 bg-neutral-700/60 dark:bg-white/10" />
                    <span className="text-tiny text-neutral-400 font-medium tabular-nums">
                      {group.items.length}{" "}
                      {group.items.length === 1
                        ? t("recordSingular")
                        : t("recordPlural")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {group.items.map((tx) => (
                      <HistoryRow
                        key={tx.id || `${tx.createdAt}-${tx.name}`}
                        transaction={tx}
                        showTimeOnly
                        onSelectTransaction={handleSelectTransaction}
                        onRequestDelete={handleRequestDelete}
                        selectable={showSelection}
                        isSelected={Boolean(
                          tx.id && visibleSelectedIds.has(tx.id),
                        )}
                        onToggleSelect={handleToggleSelect}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                        userTimeZone={userTimeZone}
                        metadataLabels={metadataLabels}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BARRA FLUTUANTE DE AÇÕES EM LOTE (exibida somente quando selectedCount > 0) */}
      {showSelection && (
        <HistoryBulkActionBar
          selectedCount={selectedCount}
          onClearSelection={handleClearSelection}
          onOpenBulkDeleteModal={() => setIsBulkModalOpen(true)}
        />
      )}

      {/* SLIDE-OVER DRAWER / BOTTOM SHEET DE DETALHES */}
      <TransactionDetailPopover
        isOpen={Boolean(selectedTransaction)}
        onClose={handleCloseDrawer}
        transaction={selectedTransaction}
        onRequestDelete={handleRequestDelete}
        suspendDismiss={Boolean(pendingDelete)}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        userTimeZone={userTimeZone}
        metadataLabels={metadataLabels}
      />

      {/* CONFIRMAÇÃO DE REMOÇÃO UNITÁRIA */}
      <ConfirmationModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => !isDeleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        description={t.rich(
          isGamified
            ? "deleteModal.description"
            : "deleteModal.descriptionProductivity",
          {
            name: pendingDelete?.name || t("deleteModal.defaultItemName"),
            bold: (chunks) => <strong>{chunks}</strong>,
          },
        )}
        confirmText={
          isDeleting ? t("deleteModal.deleting") : t("deleteModal.confirmText")
        }
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* CONFIRMAÇÃO DE REMOÇÃO EM LOTE */}
      <ConfirmationModal
        isOpen={isBulkModalOpen}
        onClose={() => !isBulkDeleting && setIsBulkModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t("bulk.modalTitle")}
        description={t.rich(
          isGamified
            ? "bulk.modalDescription"
            : "bulk.modalDescriptionProductivity",
          {
            count: selectedCount,
            bold: (chunks) => <strong>{chunks}</strong>,
          },
        )}
        confirmText={
          isBulkDeleting ? t("deleteModal.deleting") : t("bulk.confirmText")
        }
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isBulkDeleting}
      />
    </section>
  );
}
