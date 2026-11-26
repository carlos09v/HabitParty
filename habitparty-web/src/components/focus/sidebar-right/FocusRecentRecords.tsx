import {
  ChevronDown,
  History,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { FocusRecord } from "@/types/focus";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { cn, formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";
import { resolveFocusRecordDisplay } from "@/utils/focusIcons";
import { resolveFocusRecordTitle } from "@/utils/focusRecordDisplay";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

const ContextMenu = dynamic(
  () => import("@/components/ui/ContextMenu").then((mod) => mod.ContextMenu),
  { ssr: false },
);

const FocusRecordDetailsPopover = dynamic(
  () =>
    import("./FocusRecordDetailsPopover").then(
      (mod) => mod.FocusRecordDetailsPopover,
    ),
  { ssr: false },
);

const INITIAL_FOLD_COUNT = 10;

interface FocusRecentRecordItemLabels {
  freeSession: string;
  rowTooltip: string;
  leisureLabel: string;
  editRecordAria: string;
  deleteRecordAria: string;
  formatPomos: (count: number) => string;
}

interface FocusRecentRecordItemProps {
  record: FocusRecord;
  isBelowInitialFold: boolean;
  isGamified: boolean;
  locale: AppLocale;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  userTimeZone?: string | null;
  labels: FocusRecentRecordItemLabels;
  onRowClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    record: FocusRecord,
  ) => void;
  onContextMenu: (e: React.MouseEvent, record: FocusRecord) => void;
  onRequestEdit?: (record: FocusRecord) => void;
  onRequestDelete?: (record: FocusRecord) => void;
}

const FocusRecentRecordItem = memo(function FocusRecentRecordItem({
  record: rec,
  isBelowInitialFold,
  isGamified,
  locale,
  dateFormat,
  timeFormat,
  userTimeZone,
  labels,
  onRowClick,
  onContextMenu,
  onRequestEdit,
  onRequestDelete,
}: FocusRecentRecordItemProps) {
  const {
    title: displayTitle,
    subtitle: displaySubtitle,
    IconComp,
  } = resolveFocusRecordDisplay(rec, labels.freeSession);
  const fullTitle = displaySubtitle
    ? `${displayTitle} • ${displaySubtitle}`
    : displayTitle;
  const durationLabel = formatFocusRecordDuration(
    rec.startTime,
    rec.endTime,
    rec.durationMinutes,
  );

  return (
    <article
      onContextMenu={(e) => onContextMenu(e, rec)}
      className={cn(
        "group/row rounded-xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/40 shadow-2xs dark:shadow-none flex items-center justify-between gap-2 hover:border-gold/40 hover:bg-card-hover dark:hover:bg-surface/70 transition-colors select-none p-2.5",
        // Aplica content-visibility apenas nos itens abaixo da dobra inicial (após "Ver mais")
        isBelowInitialFold &&
          "[content-visibility:auto] [contain-intrinsic-size:auto_none_auto_64px]",
      )}
    >
      <button
        type="button"
        onClick={(e) => onRowClick(e, rec)}
        title={labels.rowTooltip}
        className="flex items-center justify-between gap-2.5 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary-dark/40 border border-primary/30 flex items-center justify-center shrink-0 text-primary-light group-hover/row:border-gold/40 transition-colors">
            <IconComp size={15} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-body-s font-semibold text-neutral-100 group-hover/row:text-primary dark:group-hover/row:text-gold transition-colors truncate">
                {fullTitle}
              </span>
              {rec.notes && rec.notes.trim() !== "" && (
                <span
                  title={rec.notes}
                  className="text-neutral-400 group-hover/row:text-primary dark:group-hover/row:text-gold transition-colors shrink-0 p-0.5"
                >
                  <MessageSquare size={12} aria-hidden="true" />
                </span>
              )}
            </div>
            <span className="text-tiny text-neutral-400 truncate">
              {formatDateTime(rec.endTime, {
                isLocal: true,
                locale,
                dateFormat,
                timeFormat,
                timeZone: userTimeZone,
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-body-s font-bold text-amber-800 dark:text-gold tabular-nums">
            {durationLabel}
          </span>
          {!rec.inventoryItemId &&
          ((rec.xpEarned ?? 0) > 0 || (rec.coinsEarned ?? 0) > 0) ? (
            <span className="text-tiny text-neutral-400 font-medium inline-flex items-center gap-1 tabular-nums">
              <span>
                +{rec.xpEarned ?? 0} {isGamified ? "XP" : "pts"}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5 text-amber-800 dark:text-gold font-semibold">
                +{formatCoins(rec.coinsEarned ?? 0, { locale })}
                <CoinIcon size={10} />
              </span>
            </span>
          ) : rec.completedPomos && rec.completedPomos > 0 ? (
            <span className="text-tiny text-neutral-400">
              {labels.formatPomos(rec.completedPomos)}
            </span>
          ) : rec.inventoryItemId ? (
            <span className="text-tiny text-neutral-400 font-medium">
              {labels.leisureLabel}
            </span>
          ) : null}
        </div>
      </button>

      {(onRequestEdit || onRequestDelete) && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onRequestEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestEdit(rec);
              }}
              className="min-w-8 min-h-8 sm:min-w-7 sm:min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded flex items-center justify-center text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-amber-500/15 dark:hover:bg-gold/15 opacity-85 group-hover/row:opacity-100 transition-[opacity,color,background-color] duration-150 cursor-pointer shrink-0"
              title={labels.editRecordAria}
              aria-label={labels.editRecordAria}
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
          )}

          {onRequestDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(rec);
              }}
              className="min-w-8 min-h-8 sm:min-w-7 sm:min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-500/15 opacity-85 group-hover/row:opacity-100 transition-[opacity,color,background-color] duration-150 cursor-pointer shrink-0"
              title={labels.deleteRecordAria}
              aria-label={labels.deleteRecordAria}
            >
              <Trash2 size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  );
});

interface FocusRecentRecordsProps {
  records: FocusRecord[];
  totalRecordsCount?: number;
  hasMoreRecords?: boolean;
  isLoadingMore?: boolean;
  onShowMore?: () => void;
  onAddRecord?: () => void;
  onOptionsClick?: () => void;
  onEditRecord?: (record: FocusRecord) => void;
  /** Exclui o registro; `deleteHistory` remove também o registro correspondente no Histórico. */
  onDeleteRecord?: (
    recordId: string,
    deleteHistory: boolean,
  ) => Promise<boolean> | boolean | undefined;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
  selectedActivityName?: string | null;
  onClearSelectedActivity?: () => void;
}

export function FocusRecentRecords({
  records,
  totalRecordsCount,
  hasMoreRecords = false,
  isLoadingMore = false,
  onShowMore,
  onAddRecord,
  onOptionsClick,
  onEditRecord,
  onDeleteRecord,
  onRecordUpdated,
  selectedActivityName,
  onClearSelectedActivity,
}: FocusRecentRecordsProps) {
  // 6 assinaturas lidas uma única vez no container (em vez de 6N por linha)
  const t = useTranslations("focus.records");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const itemLabels: FocusRecentRecordItemLabels = {
    freeSession: t("freeSession"),
    rowTooltip: t("rowTooltip"),
    leisureLabel: t("leisureLabel"),
    editRecordAria: t("editRecordAria"),
    deleteRecordAria: t("deleteRecordAria"),
    formatPomos: (count: number) => t("pomosCount", { count }),
  };

  // Popover de edição ancorado (com referência ao elemento para scroll-tracking e foco)
  const [selectedRecordForEdit, setSelectedRecordForEdit] =
    useState<FocusRecord | null>(null);
  const [editAnchorRect, setEditAnchorRect] = useState<DOMRect | null>(null);
  const [editAnchorElement, setEditAnchorElement] =
    useState<HTMLElement | null>(null);

  // Menu de contexto com botão direito
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    record: FocusRecord | null;
    anchorRect: DOMRect | null;
    anchorElement: HTMLElement | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    record: null,
    anchorRect: null,
    anchorElement: null,
  });

  // Confirmação única de exclusão
  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<FocusRecord | null>(null);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  const handleRequestDelete = useCallback((record: FocusRecord) => {
    setDeleteHistory(false);
    setPendingDeleteRecord(record);
  }, []);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteRecord || !onDeleteRecord) return;
    setIsDeletingRecord(true);
    try {
      const deleted = await onDeleteRecord(
        pendingDeleteRecord.id,
        !pendingDeleteRecord.inventoryItemId && deleteHistory,
      );
      if (deleted !== false) {
        setPendingDeleteRecord(null);
      }
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, record: FocusRecord) => {
      const el = e.currentTarget;
      setEditAnchorElement(el);
      setEditAnchorRect(el.getBoundingClientRect());
      setSelectedRecordForEdit(record);
    },
    [],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, record: FocusRecord) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        record,
        anchorRect: el.getBoundingClientRect(),
        anchorElement: el,
      });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2.5 w-full xl:flex-1 xl:min-h-0">
      {/* Header com Título (<h3>), Contador e Ações */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <History
            size={15}
            aria-hidden="true"
            className="text-primary-light"
          />
          <h3 className="text-body-s font-bold text-neutral-100">
            {t("title")}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-tiny text-neutral-400 font-medium mr-1 tabular-nums">
            {t("sessionsCount", { count: totalRecordsCount ?? records.length })}
          </span>

          <button
            type="button"
            onClick={onAddRecord}
            title={t("addRecordAria")}
            aria-label={t("addRecordAria")}
            className="min-w-8 min-h-8 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/70 hover:bg-amber-500/15 dark:hover:bg-gold/20 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/50 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOptionsClick}
            title={t("viewFullHistoryAria")}
            aria-label={t("viewFullHistoryAria")}
            className="min-w-8 min-h-8 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/70 hover:bg-surface-hover dark:hover:bg-white/15 text-neutral-400 hover:text-neutral-100 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
          >
            <History size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex flex-col gap-2 xl:overflow-y-auto xl:overscroll-contain xl:min-h-[180px] custom-scrollbar xl:flex-1 xl:pr-1">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-primary/30 bg-surface/30 gap-2">
            <Timer size={24} aria-hidden="true" className="text-neutral-500" />
            <p className="text-xs text-neutral-400">
              {selectedActivityName
                ? t("emptyFilteredState", { name: selectedActivityName })
                : t("emptyState")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-0.5">
              {selectedActivityName && onClearSelectedActivity && (
                <button
                  type="button"
                  onClick={onClearSelectedActivity}
                  className="min-h-7 px-2.5 py-1 rounded-lg border border-amber-500/40 dark:border-gold/40 bg-amber-500/10 dark:bg-gold/10 text-xs font-bold text-amber-800 dark:text-gold hover:bg-amber-500/20 dark:hover:bg-gold/20 transition-colors cursor-pointer"
                >
                  {t("clearFilterButton")}
                </button>
              )}
              {onAddRecord && (
                <button
                  type="button"
                  onClick={onAddRecord}
                  className="min-h-7 px-2 py-1 text-xs font-bold text-amber-700 dark:text-gold hover:underline cursor-pointer"
                >
                  {t("addFirstRecord")}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {records.map((rec, index) => (
              <FocusRecentRecordItem
                key={rec.id}
                record={rec}
                isBelowInitialFold={index >= INITIAL_FOLD_COUNT}
                isGamified={isGamified}
                locale={locale}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                userTimeZone={userTimeZone}
                labels={itemLabels}
                onRowClick={handleRowClick}
                onContextMenu={handleContextMenu}
                onRequestEdit={onEditRecord}
                onRequestDelete={
                  onDeleteRecord ? handleRequestDelete : undefined
                }
              />
            ))}
            {hasMoreRecords && onShowMore && (
              <button
                type="button"
                onClick={onShowMore}
                disabled={isLoadingMore}
                className="mt-1 flex items-center justify-center gap-1.5 w-full min-h-9 py-2 px-3 rounded-xl border border-neutral-700 dark:border-primary/30 bg-card/80 dark:bg-surface/40 hover:bg-surface-hover dark:hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-amber-700 dark:hover:text-gold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2
                      size={13}
                      aria-hidden="true"
                      className="animate-spin text-amber-700 dark:text-gold"
                    />
                    <span>{t("loadingMore")}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} aria-hidden="true" />
                    <span>{t("showMore")}</span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Popover Ancorado de Detalhes / Anotações (carregado e montado sob demanda) */}
      {selectedRecordForEdit && (
        <FocusRecordDetailsPopover
          isOpen={true}
          onClose={() => {
            setSelectedRecordForEdit(null);
            setEditAnchorRect(null);
            setEditAnchorElement(null);
          }}
          record={selectedRecordForEdit}
          anchorRect={editAnchorRect}
          anchorElement={editAnchorElement}
          onRequestEdit={onEditRecord}
          onRequestDelete={onDeleteRecord ? handleRequestDelete : undefined}
          onRecordUpdated={onRecordUpdated}
        />
      )}

      {/* Confirmação de exclusão (carregada e montada sob demanda) */}
      {pendingDeleteRecord && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => !isDeletingRecord && setPendingDeleteRecord(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeletingRecord}
          title={t("deleteConfirmTitle")}
          description={
            <p>
              {t.rich(
                isGamified
                  ? "deleteConfirmDescription"
                  : "deleteConfirmDescriptionProductivity",
                {
                  name: resolveFocusRecordTitle(
                    pendingDeleteRecord,
                    t("freeSession"),
                  ).title,
                  strong: (chunks) => (
                    <strong className="text-neutral-100">{chunks}</strong>
                  ),
                },
              )}
            </p>
          }
          confirmText={t("deleteConfirmButton")}
          variant="danger"
          checkboxLabel={
            !pendingDeleteRecord.inventoryItemId
              ? t("deleteHistoryLabel")
              : undefined
          }
          checkboxHint={
            isGamified
              ? t("deleteHistoryHint")
              : t("deleteHistoryHintProductivity")
          }
          checkboxChecked={deleteHistory}
          onCheckboxChange={setDeleteHistory}
        />
      )}

      {/* Menu de Contexto (carregado e montado sob demanda) */}
      {contextMenu.isOpen && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          items={[
            ...(onEditRecord
              ? [
                  {
                    label: t("contextEditRecord"),
                    icon: <Pencil size={14} />,
                    onClick: () => {
                      if (contextMenu.record) {
                        onEditRecord(contextMenu.record);
                      }
                    },
                  },
                ]
              : []),
            {
              label: t("contextEditNotes"),
              icon: <MessageSquare size={14} />,
              onClick: () => {
                if (contextMenu.record) {
                  setEditAnchorElement(contextMenu.anchorElement);
                  setEditAnchorRect(contextMenu.anchorRect);
                  setSelectedRecordForEdit(contextMenu.record);
                }
              },
            },
            ...(onDeleteRecord
              ? [
                  {
                    label: t("contextDeleteRecord"),
                    icon: <Trash2 size={14} />,
                    variant: "destructive" as const,
                    onClick: () => {
                      if (contextMenu.record) {
                        handleRequestDelete(contextMenu.record);
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
