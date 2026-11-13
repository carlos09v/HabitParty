"use client";

import {
  History,
  MessageSquare,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { getFocusIcon } from "@/constants/focus";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import type { FocusRecord } from "@/types/focus";
import { cn, formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";
import { FocusRecordDetailsPopover } from "./FocusRecordDetailsPopover";

interface FocusRecentRecordItemProps {
  record: FocusRecord;
  isCompact: boolean;
  onRowClick: (e: React.MouseEvent, record: FocusRecord) => void;
  onContextMenu: (e: React.MouseEvent, record: FocusRecord) => void;
  onRequestDelete?: (record: FocusRecord) => void;
}

const FocusRecentRecordItem = memo(function FocusRecentRecordItem({
  record: rec,
  isCompact,
  onRowClick,
  onContextMenu,
  onRequestDelete,
}: FocusRecentRecordItemProps) {
  const t = useTranslations("focus.records");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const IconComp = rec.activityIcon ? getFocusIcon(rec.activityIcon) : Timer;
  const durationLabel = formatFocusRecordDuration(
    rec.startTime,
    rec.endTime,
    rec.durationMinutes,
  );

  return (
    <article
      onClick={(e) => onRowClick(e, rec)}
      onContextMenu={(e) => onContextMenu(e, rec)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick(e as unknown as React.MouseEvent, rec);
        }
      }}
      title={t("rowTooltip")}
      className={cn(
        "group/row rounded-xl border border-neutral-700 dark:border-primary/20 bg-white dark:bg-surface/40 shadow-2xs dark:shadow-none flex items-center justify-between gap-2.5 hover:border-gold/40 hover:bg-card-hover dark:hover:bg-surface/70 transition-colors cursor-pointer select-none",
        isCompact ? "p-2" : "p-2.5",
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-primary-dark/40 border border-primary/30 flex items-center justify-center shrink-0 text-primary-light group-hover/row:border-gold/40 transition-colors">
          <IconComp size={15} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-body-s font-semibold text-neutral-100 group-hover/row:text-primary dark:group-hover/row:text-gold transition-colors truncate">
              {rec.activityName && rec.taskNameSnapshot
                ? `${rec.activityName} • ${rec.taskNameSnapshot}`
                : rec.activityName ||
                  rec.taskNameSnapshot ||
                  rec.itemName ||
                  t("freeSession")}
            </span>
            {rec.notes && rec.notes.trim() !== "" && (
              <span
                title={rec.notes}
                className="text-neutral-400 group-hover/row:text-primary dark:group-hover/row:text-gold transition-colors shrink-0 p-0.5"
              >
                <MessageSquare size={isCompact ? 10 : 12} />
              </span>
            )}
          </div>
          <span className="text-tiny text-neutral-400 truncate">
            {formatDateTime(rec.endTime, {
              isLocal: true,
              locale,
              dateFormat,
              timeFormat,
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-body-s font-bold text-gold">
            {durationLabel}
          </span>
          {!rec.inventoryItemId &&
          ((rec.xpEarned ?? 0) > 0 || (rec.coinsEarned ?? 0) > 0) ? (
            <span className="text-tiny text-neutral-400 font-medium inline-flex items-center gap-1">
              <span>
                +{rec.xpEarned ?? 0} {isGamified ? "XP" : "pts"}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5 text-gold font-semibold">
                +{formatCoins(rec.coinsEarned ?? 0, { locale })}
                <CoinIcon size={10} />
              </span>
            </span>
          ) : rec.completedPomos && rec.completedPomos > 0 ? (
            <span className="text-tiny text-neutral-400">
              {t("pomosCount", { count: rec.completedPomos })}
            </span>
          ) : rec.inventoryItemId ? (
            <span className="text-tiny text-neutral-400 font-medium">
              {t("leisureLabel")}
            </span>
          ) : null}
        </div>

        {/* Botão de Excluir Registro direto */}
        {onRequestDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(rec);
            }}
            className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-500/15 opacity-85 group-hover/row:opacity-100 transition-[opacity,color,background-color] duration-150 cursor-pointer"
            title={t("deleteRecordAria")}
            aria-label={t("deleteRecordAria")}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </article>
  );
});

interface FocusRecentRecordsProps {
  records: FocusRecord[];
  onAddRecord?: () => void;
  onOptionsClick?: () => void;
  /** Exclui o registro; `deleteHistory` remove também o registro correspondente no Histórico. */
  onDeleteRecord?: (
    recordId: string,
    deleteHistory: boolean,
  ) => void | Promise<void>;
  isCompact?: boolean;
}

export function FocusRecentRecords({
  records,
  onAddRecord,
  onOptionsClick,
  onDeleteRecord,
  isCompact = false,
}: FocusRecentRecordsProps) {
  const t = useTranslations("focus.records");
  // Popover de edição ancorado
  const [selectedRecordForEdit, setSelectedRecordForEdit] =
    useState<FocusRecord | null>(null);
  const [editAnchorRect, setEditAnchorRect] = useState<DOMRect | null>(null);

  // Menu de contexto com botão direito
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    record: FocusRecord | null;
    anchorRect: DOMRect | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    record: null,
    anchorRect: null,
  });

  // Confirmação única de exclusão (botão da linha, menu de contexto e popover)
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
      // Itens de lazer (mochila) não geram registro no Histórico
      await onDeleteRecord(
        pendingDeleteRecord.id,
        !pendingDeleteRecord.inventoryItemId && deleteHistory,
      );
      setPendingDeleteRecord(null);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleRowClick = useCallback(
    (e: React.MouseEvent, record: FocusRecord) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setEditAnchorRect(rect);
      setSelectedRecordForEdit(record);
    },
    [],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, record: FocusRecord) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        record,
        anchorRect: rect,
      });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2.5 w-full flex-1 min-h-0">
      {/* Header com Título, Contador e Ações (+ e ...) */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <History size={15} className="text-primary-light" />
          <h4 className="text-body-s font-bold text-neutral-100">
            {t("title")}
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-tiny text-neutral-400 font-medium mr-1">
            {t("sessionsCount", { count: records.length })}
          </span>

          {/* Botão + (Novo Registro) */}
          <button
            type="button"
            onClick={onAddRecord}
            title={t("addRecordAria")}
            aria-label={t("addRecordAria")}
            className="w-7 h-7 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/70 hover:bg-amber-500/15 dark:hover:bg-gold/20 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/50 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
          </button>

          {/* Botão ... (Opções da Seção) */}
          <button
            type="button"
            onClick={onOptionsClick}
            title={t("viewFullHistoryAria")}
            aria-label={t("viewFullHistoryAria")}
            className="w-7 h-7 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/70 hover:bg-surface-hover dark:hover:bg-white/15 text-neutral-400 hover:text-neutral-100 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
          >
            <History size={14} />
          </button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-primary/30 bg-surface/30">
            <Timer size={24} className="text-neutral-500 mb-1" />
            <p className="text-xs text-neutral-400">{t("emptyState")}</p>
            {onAddRecord && (
              <button
                type="button"
                onClick={onAddRecord}
                className="mt-2 text-xs font-bold text-gold hover:underline cursor-pointer"
              >
                {t("addFirstRecord")}
              </button>
            )}
          </div>
        ) : (
          records.map((rec) => (
            <FocusRecentRecordItem
              key={rec.id}
              record={rec}
              isCompact={isCompact}
              onRowClick={handleRowClick}
              onContextMenu={handleContextMenu}
              onRequestDelete={onDeleteRecord ? handleRequestDelete : undefined}
            />
          ))
        )}
      </div>

      {/* Popover Ancorado de Edição do Registro */}
      <FocusRecordDetailsPopover
        isOpen={selectedRecordForEdit !== null}
        onClose={() => {
          setSelectedRecordForEdit(null);
          setEditAnchorRect(null);
        }}
        record={selectedRecordForEdit}
        anchorRect={editAnchorRect}
        onRequestDelete={onDeleteRecord ? handleRequestDelete : undefined}
      />

      {/* Confirmação de exclusão com opção de limpar o Histórico */}
      <ConfirmationModal
        isOpen={pendingDeleteRecord !== null}
        onClose={() => !isDeletingRecord && setPendingDeleteRecord(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingRecord}
        title={t("deleteConfirmTitle")}
        description={
          <p>
            {t.rich("deleteConfirmDescription", {
              name:
                pendingDeleteRecord?.activityName ||
                pendingDeleteRecord?.taskNameSnapshot ||
                pendingDeleteRecord?.itemName ||
                t("freeSession"),
              strong: (chunks) => (
                <strong className="text-neutral-100">{chunks}</strong>
              ),
            })}
          </p>
        }
        confirmText={t("deleteConfirmButton")}
        variant="danger"
        checkboxLabel={
          pendingDeleteRecord && !pendingDeleteRecord.inventoryItemId
            ? t("deleteHistoryLabel")
            : undefined
        }
        checkboxHint={t("deleteHistoryHint")}
        checkboxChecked={deleteHistory}
        onCheckboxChange={setDeleteHistory}
      />

      {/* Menu de Contexto (Clique com Botão Direito) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: t("contextEditNotes"),
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.record) {
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
    </div>
  );
}
