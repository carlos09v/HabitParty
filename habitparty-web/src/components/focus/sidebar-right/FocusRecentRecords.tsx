"use client";

import {
  History,
  MessageSquare,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { getFocusIcon } from "@/constants/focus";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { FocusRecord } from "@/types/focus";
import { cn, formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";
import { FocusRecordDetailsPopover } from "./FocusRecordDetailsPopover";

interface FocusRecentRecordsProps {
  records: FocusRecord[];
  onAddRecord?: () => void;
  onOptionsClick?: () => void;
  onDeleteRecord?: (recordId: string) => void;
  onRecordUpdated?: () => void;
  isCompact?: boolean;
}

export function FocusRecentRecords({
  records,
  onAddRecord,
  onOptionsClick,
  onDeleteRecord,
  onRecordUpdated,
  isCompact: propIsCompact,
}: FocusRecentRecordsProps) {
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

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

  const handleRowClick = (e: React.MouseEvent, record: FocusRecord) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setEditAnchorRect(rect);
    setSelectedRecordForEdit(record);
  };

  const handleContextMenu = (e: React.MouseEvent, record: FocusRecord) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      record,
      anchorRect: rect,
    });
  };

  return (
    <div className="flex flex-col gap-2.5 w-full flex-1 min-h-0">
      {/* Header com Título, Contador e Ações (+ e ...) */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <History size={15} className="text-primary-light" />
          <h4 className="text-body-s font-bold text-neutral-100">
            Foco em Registro
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-tiny text-neutral-400 font-medium mr-1">
            {records.length} {records.length === 1 ? "sessão" : "sessões"}
          </span>

          {/* Botão + (Novo Registro) */}
          <button
            type="button"
            onClick={onAddRecord}
            title="Inserir novo registro de foco"
            aria-label="Inserir novo registro de foco"
            className="w-7 h-7 rounded-lg border border-primary/30 bg-surface/70 hover:bg-gold/20 text-neutral-300 hover:text-gold hover:border-gold/50 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} />
          </button>

          {/* Botão ... (Opções da Seção) */}
          <button
            type="button"
            onClick={onOptionsClick}
            title="Ver extrato completo no Histórico"
            aria-label="Ver extrato completo no Histórico"
            className="w-7 h-7 rounded-lg border border-primary/30 bg-surface/70 hover:bg-white/15 text-neutral-400 hover:text-neutral-100 transition-all flex items-center justify-center cursor-pointer shadow-xs"
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
            <p className="text-xs text-neutral-400">
              Nenhuma sessão registrada para o período selecionado.
            </p>
            {onAddRecord && (
              <button
                type="button"
                onClick={onAddRecord}
                className="mt-2 text-xs font-bold text-gold hover:underline cursor-pointer"
              >
                + Adicionar primeiro registro
              </button>
            )}
          </div>
        ) : (
          records.map((rec) => {
            const IconComp = rec.activityIcon
              ? getFocusIcon(rec.activityIcon)
              : Timer;
            const durationLabel = formatFocusRecordDuration(
              rec.startTime,
              rec.endTime,
              rec.durationMinutes,
            );

            return (
              <article
                key={rec.id}
                onClick={(e) => handleRowClick(e, rec)}
                onContextMenu={(e) => handleContextMenu(e, rec)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(e as unknown as React.MouseEvent, rec);
                  }
                }}
                title="Clique para editar anotações ou botão direito para opções"
                className={cn(
                  "group/row rounded-xl border border-primary/20 bg-surface/40 flex items-center justify-between gap-2.5 hover:border-gold/40 hover:bg-surface/70 transition-all cursor-pointer select-none",
                  isCompact ? "p-2" : "p-2.5",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary-dark/40 border border-primary/30 flex items-center justify-center shrink-0 text-primary-light group-hover/row:border-gold/40 transition-colors">
                    <IconComp size={15} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-body-s font-semibold text-neutral-100 group-hover/row:text-gold transition-colors truncate">
                        {rec.activityName || rec.itemName || "Sessão Livre"}
                      </span>
                      {rec.notes && rec.notes.trim() !== "" && (
                        <span
                          title={rec.notes}
                          className="text-neutral-400 group-hover/row:text-gold transition-colors shrink-0 p-0.5"
                        >
                          <MessageSquare size={isCompact ? 10 : 12} />
                        </span>
                      )}
                    </div>
                    <span className="text-tiny text-neutral-400 truncate">
                      {formatDateTime(rec.endTime)}
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
                      <span className="text-[10px] text-neutral-400 font-medium">
                        +{rec.xpEarned ?? 0} XP • +
                        {formatCoins(rec.coinsEarned ?? 0)} H
                      </span>
                    ) : rec.completedPomos && rec.completedPomos > 0 ? (
                      <span className="text-tiny text-neutral-400">
                        {rec.completedPomos} pomo
                        {rec.completedPomos > 1 ? "s" : ""}
                      </span>
                    ) : rec.inventoryItemId ? (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Lazer
                      </span>
                    ) : null}
                  </div>

                  {/* Botão de Excluir Registro direto */}
                  {onDeleteRecord && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(rec.id);
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/15 opacity-70 group-hover/row:opacity-100 transition-all cursor-pointer"
                      title="Excluir este registro"
                      aria-label="Excluir este registro"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </article>
            );
          })
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
        onDeleteRecord={onDeleteRecord}
        onRecordUpdated={onRecordUpdated}
      />

      {/* Menu de Contexto (Clique com Botão Direito) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: "Editar Anotações",
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
                  label: "Excluir Registro",
                  icon: <Trash2 size={14} />,
                  variant: "destructive" as const,
                  onClick: () => {
                    if (contextMenu.record) {
                      onDeleteRecord(contextMenu.record.id);
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
