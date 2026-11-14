"use client";

import { Calendar, History as HistoryIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteTransactionAction,
  deleteTransactionsBatchAction,
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
import { useUserStore } from "@/store/userStore";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import { cn, groupTransactionsByDay } from "@/utils";
import type {
  TransactionDayLabels,
  TransactionMetadataLabels,
} from "@/utils/historyUtils";
import { HistoryBulkActionBar } from "./HistoryBulkActionBar";
import { HistoryRow } from "./HistoryRow";
import { TransactionDetailPopover } from "./TransactionDetailPopover";

interface HistoryTableProps {
  transactions: TransactionHistoryResponseDTO[];
  isCompact?: boolean;
  onDelete?: (id: string) => Promise<void> | void;
  /** Habilita seleção múltipla com "Selecionar tudo" e exclusão em lote. */
  selectable?: boolean;
}

export function HistoryTable({
  transactions,
  isCompact = false,
  onDelete,
  selectable = false,
}: HistoryTableProps) {
  const t = useTranslations("history.table");
  const tUtils = useTranslations("history.utils");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionHistoryResponseDTO | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<TransactionHistoryResponseDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===== Seleção múltipla =====
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const selectableIds = useMemo(
    () =>
      transactions.map((tx) => tx.id).filter((id): id is string => Boolean(id)),
    [transactions],
  );

  // Mantém apenas IDs ainda visíveis (troca de página/aba/filtro ou exclusão)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(selectableIds);
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectableIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    selectableIds.length > 0 && selectedCount === selectableIds.length;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;
  const showSelection = selectable && selectableIds.length > 0;

  const handleToggleSelect = useCallback(
    (tx: TransactionHistoryResponseDTO) => {
      const id = tx.id;
      if (!id) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [],
  );

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? new Set() : new Set(selectableIds));
  }, [isAllSelected, selectableIds]);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleConfirmBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await deleteTransactionsBatchAction(ids);
      if (!res.success) {
        toast.error(res.error || t("bulk.deleteError"));
        return;
      }
      toast.success(t("bulk.deleteSuccess", { count: ids.length }));
      if (selectedTransaction?.id && selectedIds.has(selectedTransaction.id)) {
        setSelectedTransaction(null);
        setAnchorRect(null);
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

  const groupedTransactions = useMemo(
    () =>
      groupTransactionsByDay(
        transactions,
        new Date(),
        locale,
        dateFormat,
        userTimeZone,
        dayLabels,
      ),
    [transactions, locale, dateFormat, userTimeZone, dayLabels],
  );

  const handleRowClick = useCallback(
    (tx: TransactionHistoryResponseDTO, rect: DOMRect) => {
      setSelectedTransaction(tx);
      setAnchorRect(rect);
    },
    [],
  );

  const handleClosePopover = useCallback(() => {
    setSelectedTransaction(null);
    setAnchorRect(null);
  }, []);

  // Confirmação única para exclusões vindas da linha ou do popover
  const handleRequestDelete = useCallback(
    (tx: TransactionHistoryResponseDTO) => setPendingDelete(tx),
    [],
  );

  const handleConfirmDelete = async () => {
    if (!pendingDelete?.id) return;
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(pendingDelete.id);
      } else {
        const res = await deleteTransactionAction(pendingDelete.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.deleteError"));
          return;
        }
        toast.success(t("toasts.deleteSuccess"));
      }

      if (selectedTransaction?.id === pendingDelete.id) {
        handleClosePopover();
      }
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      className="flex flex-col gap-2.5 w-full"
      aria-label={t("sectionAria")}
    >
      {/* BARRA DE SELEÇÃO / AÇÕES EM LOTE */}
      {showSelection && (
        <HistoryBulkActionBar
          selectedCount={selectedCount}
          isAllSelected={isAllSelected}
          isPartiallySelected={isPartiallySelected}
          isCompact={isCompact}
          onToggleSelectAll={handleToggleSelectAll}
          onClearSelection={handleClearSelection}
          onOpenBulkDeleteModal={() => setIsBulkModalOpen(true)}
        />
      )}

      {/* WRAPPER COM ROLAGEM HORIZONTAL PARA DESKTOP/TABLET QUANDO NECESSÁRIO */}
      <div className="w-full overflow-x-visible md:overflow-x-auto pb-1">
        <div className="min-w-0 md:min-w-[760px] flex flex-col gap-2">
          {/* CABEÇALHO DA TABELA (Apenas desktop/tablet) */}
          <div
            className={cn(
              "hidden md:grid items-center text-xs font-semibold text-neutral-400 select-none",
              showSelection ? HISTORY_GRID_COLS_SELECTABLE : HISTORY_GRID_COLS,
              isCompact ? "gap-2.5 px-3 py-1.5" : "gap-3.5 px-4 py-2",
            )}
            aria-hidden="true"
          >
            {showSelection && <span />}
            <span>{t("headers.eventItem")}</span>
            <span>{t("headers.eventType")}</span>
            <span>
              {isGamified
                ? t("headers.difficultyTags")
                : t("headers.difficultyTagsProductivity")}
            </span>
            <span>
              {isGamified ? t("headers.coins") : t("headers.coinsProductivity")}
            </span>
            <span>
              {isGamified ? t("headers.xp") : t("headers.xpProductivity")}
            </span>
            <span className="text-right">{t("headers.time")}</span>
            <span className="sr-only">{t("headers.actions")}</span>
          </div>

          {/* LISTA AGRUPADA POR DIA OU ESTADO VAZIO */}
          {transactions.length === 0 ? (
            <div
              className={cn(
                "w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-primary/30 bg-primary-dark/20",
                isCompact ? "py-10 px-4 gap-2.5" : "py-16 px-6 gap-3.5",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-gold shadow-sm">
                <HistoryIcon size={24} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h4 className="text-body-m font-bold text-neutral-100">
                  {t("emptyTitle")}
                </h4>
                <p className="text-body-s text-neutral-400">
                  {isGamified
                    ? t("emptyDescription")
                    : t("emptyDescriptionProductivity")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 min-h-[350px]">
              {groupedTransactions.map((group, groupIdx) => (
                <div
                  key={group.dateKey}
                  className={cn(
                    "flex flex-col gap-2",
                    groupIdx > 0 && "deferred-history-group",
                  )}
                >
                  {/* Divisor de Dia ("Hoje", "Ontem", "Ter, 12 Out") */}
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface/80 border border-primary/30 text-label-g font-bold text-neutral-200 shadow-xs">
                      <Calendar size={11} className="text-gold shrink-0" />
                      <span>{group.label}</span>
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-tiny text-neutral-400 font-medium">
                      {group.items.length}{" "}
                      {group.items.length === 1
                        ? t("recordSingular")
                        : t("recordPlural")}
                    </span>
                  </div>

                  {/* Linhas do Dia */}
                  <div className="flex flex-col gap-2">
                    {group.items.map((tx) => (
                      <HistoryRow
                        key={tx.id || `${tx.createdAt}-${tx.name}`}
                        transaction={tx}
                        isCompact={isCompact}
                        showTimeOnly
                        onClick={handleRowClick}
                        onRequestDelete={handleRequestDelete}
                        selectable={showSelection}
                        isSelected={Boolean(tx.id && selectedIds.has(tx.id))}
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

      {/* POPOVER ANCORADO DA TRANSAÇÃO SELECIONADA */}
      <TransactionDetailPopover
        isOpen={Boolean(selectedTransaction)}
        onClose={handleClosePopover}
        transaction={selectedTransaction}
        anchorRect={anchorRect}
        onRequestDelete={handleRequestDelete}
        suspendDismiss={Boolean(pendingDelete)}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        userTimeZone={userTimeZone}
        metadataLabels={metadataLabels}
      />

      {/* CONFIRMAÇÃO DE EXCLUSÃO (o extrato é apenas registro: não altera saldo) */}
      <ConfirmationModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => !isDeleting && setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        description={t.rich("deleteModal.description", {
          name: pendingDelete?.name || t("deleteModal.defaultItemName"),
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
        confirmText={
          isDeleting ? t("deleteModal.deleting") : t("deleteModal.confirmText")
        }
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* CONFIRMAÇÃO DE EXCLUSÃO EM LOTE */}
      <ConfirmationModal
        isOpen={isBulkModalOpen}
        onClose={() => !isBulkDeleting && setIsBulkModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={t("bulk.modalTitle")}
        description={t.rich("bulk.modalDescription", {
          count: selectedCount,
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
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
